"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import {
  BuildingOffice2Icon,
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../../../../../../../hooks/useSession";

const fetcher = (url) => axios.get(url).then((res) => res.data);

const ViewUnitPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const landlord_id = user?.landlord_id;

  const { data: property } = useSWR(
    id ? `/api/propertyListing/property/${id}` : null,
    fetcher
  );
  const { data: subscription, isLoading: loadingSubscription } = useSWR(
    `/api/subscription/getCurrentPlan/${landlord_id}`,
    fetcher
  );

  const {
    data: units,
    error,
    isLoading,
  } = useSWR(id ? `/api/unitListing/unit?property_id=${id}` : null, fetcher);

  const handleEditUnit = (unitId) => {
    router.push(
      `/pages/landlord/property-listing/view-unit/${id}/edit-unit/${unitId}`
    );
  };

  const handleAddUnitClick = () => {
    if (!subscription) {
      Swal.fire(
        "Subscription Required",
        "You need an active subscription to add a unit. Please subscribe to continue.",
        "warning"
      );
      return;
    }

    if (units.length >= subscription.listingLimits.maxUnits) {
      Swal.fire(
        "Unit Limit Reached",
        `You have reached the maximum unit limit (${subscription.listingLimits.maxUnits}) for your plan.`,
        "error"
      );
      return;
    }

    router.push(
      `/pages/landlord/property-listing/view-unit/${id}/create-unit?property_id=${id}`
    );
  };

  const handleDeleteUnit = async (unitId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.delete(`/api/unitListing/unit?id=${unitId}`);

      if (response.status === 200) {
        Swal.fire("Deleted!", "Unit has been deleted.", "success");
        mutate(`/api/propertyListing/property/${id}`);
        mutate(`/api/unitListing/unit?property_id=${id}`);
      } else {
        Swal.fire(
          "Error",
          "Failed to delete the unit. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting unit:", error);

      let errorMessage = "Failed to delete the unit. Please try again.";

      if (error.response && error.response.data?.error) {
        if (
          error.response.data.error ===
          "Cannot delete unit with active lease agreement"
        ) {
          errorMessage =
            "This unit cannot be deleted because it has an active lease.";
        }
      }

      await Swal.fire("Error", errorMessage, "error");
    }
  };

  if (error)
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-red-500 text-center">
              Failed to load units. Please try again later.
            </p>
          </div>
        </div>
      </LandlordLayout>
    );

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Property Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600">
              {isLoading
                ? "Loading..."
                : property?.property_name || "Property Details"}
            </h1>
          </div>
          <p className="text-gray-600 mb-4">Manage units for this property</p>
          {subscription && (
            <p className="text-gray-600 text-sm mb-2">
              <span className="font-medium">
                {units?.length}/{subscription.listingLimits.maxUnits}
              </span>{" "}
              units used
            </p>
          )}
          <button
            className={`flex items-center px-4 py-2 rounded-md font-bold transition-colors ${
              loadingSubscription ||
              !subscription ||
              units?.length >= subscription?.listingLimits?.maxUnits
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            onClick={handleAddUnitClick}
            disabled={
              loadingSubscription ||
              !subscription ||
              units?.length >= subscription?.listingLimits?.maxUnits
            }
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Add New Unit
          </button>
          {subscription &&
            units?.length >= subscription.listingLimits.maxUnits && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <div className="flex items-center">
                  <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-2" />
                  <p className="font-semibold">
                    You have reached your unit limit. Upgrade your plan to add
                    more.
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Units Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Available Units
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : units && units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {units.map((unit) => (
                <div
                  key={unit?.unit_id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-32 bg-blue-50 flex items-center justify-center">
                    <div className="text-center">
                      <HomeIcon className="h-12 w-12 text-blue-600 mx-auto" />
                      <h3 className="text-xl font-bold text-gray-800">
                        Unit {unit?.unit_name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm text-gray-600">
                        Size:{" "}
                        <span className="font-medium">
                          {unit?.unit_size} sqm
                        </span>
                      </p>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          unit?.status === "Occupied"
                            ? "bg-green-100 text-green-800"
                            : unit?.status === "Unoccupied"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {unit?.status.charAt(0).toUpperCase() +
                          unit?.status.slice(1)}
                      </span>
                    </div>

                    <hr className="my-3" />

                    <div className="flex justify-between items-center">
                      <button
                        className="flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        onClick={() =>
                          router.push(
                            `/pages/landlord/property-listing/view-unit/tenant-req/${unit.unit_id}`
                          )
                        }
                      >
                        <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                        Tenant Requests
                      </button>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                          onClick={() => handleEditUnit(unit.unit_id)}
                          aria-label="Edit unit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          onClick={() => handleDeleteUnit(unit.unit_id)}
                          aria-label="Delete unit"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <HomeIcon className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 text-lg font-medium mb-2">
                No Units Available
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Add your first unit to get started
              </p>
              <button
                className="px-4 py-2 text-sm text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                onClick={handleAddUnitClick}
              >
                Add Your First Unit
              </button>
            </div>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
};

export default ViewUnitPage;
