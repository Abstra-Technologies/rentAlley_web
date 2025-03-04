"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import usePropertyStore from "../../../../zustand/propertyStore";
import useAuth from "../../../../../hooks/useSession";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import {
  BuildingOffice2Icon,
  HomeIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Link from "next/link";

const PropertyListingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, fetchAllProperties, loading, error } = usePropertyStore();
  const [isVerified, setIsVerified] = useState(null);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [isFetchingVerification, setIsFetchingVerification] = useState(true);
  const [fetchingSubscription, setFetchingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user?.landlord_id) {
      // Ensure user is not null/undefined
      console.log("Landlord ID:", user.landlord_id);
      fetchAllProperties(user.landlord_id);
    }
  }, [user?.landlord_id]);

  useEffect(() => {
    if (user?.userType === "landlord") {
      setIsVerified(null);
      setIsFetchingVerification(true);

      axios
        .get(`/api/landlord/verification-status?user_id=${user.user_id}`)
        .then((response) => {
          console.log("✅ Fetched Verification Status:", response.data);
          setIsVerified(response.data.verification_status);
        })
        .catch((err) => {
          console.error("Failed to fetch landlord verification status:", err);
        })
        .finally(() => {
          setIsFetchingVerification(false);
        });

      setFetchingSubscription(true);
      axios
        .get(`/api/subscription/getCurrentPlan/${user.landlord_id}`)
        .then((response) => {
          setSubscription(response.data);
        })
        .catch((err) => {
          console.error(" Failed to fetch subscription:", err);
        })
        .finally(() => setFetchingSubscription(false));
    }
  }, [user]);

  const handleEdit = (propertyId, event) => {
    event.stopPropagation();
    router.push(`../landlord/property-listing/edit-property/${propertyId}`);
  };

  const handleView = useCallback((property, event) => {
    event.stopPropagation();
    router.push(
      `/pages/landlord/property-listing/view-unit/${property.property_id}`
    );
  });

  const handleAddProperty = () => {
    if (!isVerified) {
      setShowVerifyPopup(true);
      return;
    }

    // subscription handling goes here.
    // listing limit comes from api backend.
    if (
      subscription &&
      properties.length >= subscription.listingLimits.maxProperties
    ) {
      Swal.fire(
        "Property Limit Reached",
        `You have reached the maximum property limit (${subscription.listingLimits.maxProperties}) for your plan.`,
        "error"
      );
      return;
    }
    router.push(`/pages/landlord/property-listing/create-property`);
  };

  const handleDelete = useCallback(async (propertyId, event) => {
    event.stopPropagation();

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to recover this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `/api/propertyListing/propListing?id=${propertyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        Swal.fire({
          title: "Deleted!",
          text: "Property has been deleted.",
          icon: "success",
          showConfirmButton: true,
          confirmButtonText: "Close",
        }).then(() => {
          fetchAllProperties(user.landlord_id);
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: "Failed to delete property.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while deleting the property.",
        icon: "error",
      });
    }
  });

  if (!user?.landlord_id) {
    return <p className="text-center mt-4">Loading...</p>;
  }

  if (loading)
    return <p className="text-center mt-4">Fetching properties...</p>;
  if (error) return <p className="text-center mt-4 text-red-500">{error}</p>;

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Property Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">
                Property Listings
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {subscription && (
                <p className="text-gray-600 text-sm hidden md:block">
                  <span className="font-medium">{properties.length}/{subscription.listingLimits.maxProperties}</span> properties used
                </p>
              )}
              <button
                className={`flex items-center px-4 py-2 rounded-md font-bold transition-colors ${
                  isFetchingVerification
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : isVerified
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
                onClick={handleAddProperty}
                disabled={isFetchingVerification || !isVerified}
              >
                {isFetchingVerification ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking...
                  </span>
                ) : (
                  <>
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Add New Property
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            Manage your property listings and units
          </p>
        </div>

        {/* Alerts Section */}
        {subscription &&
          properties.length >= subscription.listingLimits.maxProperties && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <p className="font-bold text-red-700">Property Limit Reached</p>
                  <p className="text-sm text-red-600">You have reached your max property listing limit. Please upgrade your plan to list more properties.</p>
                </div>
              </div>
            </div>
          )}

        {!isFetchingVerification && !isVerified && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
              <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded-md text-center my-4">
                <strong>⚠️ Verification Required!</strong>
                <p>You must verify your account before listing a property.</p>
                <Link href="/pages/landlord/verification" className="text-blue-600 underline">
                  Verify your Account
                </Link>
              </div>
            </div> // ✅ Properly closing the outer <div>
        )}


        {/* Properties List */}
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
    <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
    Your Properties
  </h2>

  {properties.length === 0 ? (
    // Empty state remains the same
    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      {/* ... */}
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property?.property_id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col"
        >
          {/* Property Image - Fixed height */}
          <div
            className="h-48 cursor-pointer"
            onClick={(event) => handleView(property, event)}
          >
            {property.photos.length > 0 ? (
              <Image
                src={property.photos[0].photo_url}
                alt={property.property_name}
                width={400}
                height={250}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <BuildingOffice2Icon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Property Details - Flex grow to fill space */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="mb-2 flex-1">
              {/* Truncate long text */}
              <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                {property?.property_name}
              </h3>
              <div className="flex items-start text-gray-600 text-sm mb-2">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                <p className="line-clamp-2">
                  {property?.street}, {property?.city},{" "}
                  {property?.province
                    .split("_")
                    .map(
                      (word) => word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ")}{" "}
                </p>
              </div>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {property?.property_type.charAt(0).toUpperCase() +
                  property?.property_type.slice(1)}
              </span>
            </div>

            {/* Action buttons at the bottom */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <div className="flex justify-between">
                <button
                  className="flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  onClick={(event) => handleView(property, event)}
                >
                  <HomeIcon className="h-4 w-4 mr-1" />
                  View Units
                </button>

                <div className="flex space-x-2">
                  <button
                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                    onClick={(event) => handleEdit(property?.property_id, event)}
                    aria-label="Edit property"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    onClick={(event) => handleDelete(property?.property_id, event)}
                    aria-label="Delete property"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {/* Verification Popup */}
        {showVerifyPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full">
              <ExclamationCircleIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Verification Required</h3>
              <p className="text-gray-600 mb-6">
                You need to verify your account before adding a property.
              </p>
              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => setShowVerifyPopup(false)}
              >
                I Understand
              </button>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
};

export default PropertyListingPage;


