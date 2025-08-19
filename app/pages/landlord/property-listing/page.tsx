"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import usePropertyStore from "../../../../zustand/property/usePropertyStore";
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
} from "@heroicons/react/24/outline";
import Link from "next/link";
import useAuthStore from "../../../../zustand/authStore";

const PropertyListingPage = () => {
  const router = useRouter();
  const {fetchSession, user, admin} = useAuthStore();
  const {properties, fetchAllProperties, loading, error} = usePropertyStore();

  const [verificationStatus, setVerificationStatus] = useState<string>("not verified");
  const [isFetchingVerification, setIsFetchingVerification] = useState(true);
  const [fetchingSubscription, setFetchingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  useEffect(() => {
    if (user?.landlord_id) {
      fetchAllProperties(user?.landlord_id);
    }
  }, [user?.landlord_id, fetchAllProperties]);

  useEffect(() => {
    if (properties.length > 0) {
      const hasUnverifiedProperties = properties.some(
          (property) =>
              property?.verification_status?.toLowerCase() !== "verified"
      );
      setPendingApproval(hasUnverifiedProperties);
    }
  }, [properties]);

  // Fetch verification + subscription status
  useEffect(() => {
    if (user?.userType !== "landlord") return;

    setVerificationStatus(null); // store the exact status instead of just true/false
    setIsFetchingVerification(true);

    const fetchVerificationAndSubscription = async () => {
      try {
        // Fetch verification status
        const verificationRes = await axios.get(
            `/api/landlord/verification-upload/status?user_id=${user?.user_id}`
        );
        const status = verificationRes.data.verification_status || "not verified";
        console.log('status of landlord: ', status);
        setVerificationStatus(status.toLowerCase());
      } catch (err) {
        console.error("[ERROR] Failed to fetch landlord verification:", err);
        setVerificationStatus("not verified");
      } finally {
        setIsFetchingVerification(false);
      }

      try {
        // Fetch subscription
        setFetchingSubscription(true);
        const subscriptionRes = await axios.get(
            `/api/landlord/subscription/active/${user?.landlord_id}`
        );
        setSubscription(subscriptionRes.data);
      } catch (err) {
        console.error("[ERROR] Failed to fetch subscription:", err);
      } finally {
        setFetchingSubscription(false);
      }
    };

    fetchVerificationAndSubscription();
  }, [user]);


  // @ts-ignore
  const handleEdit = (propertyId, event) => {
    event.stopPropagation();
    router.push(`../landlord/property-listing/edit-property/${propertyId}`);
  };

  // @ts-ignore
  const handleView = useCallback((property, event) => {
    event.stopPropagation();
    router.push(
        `/pages/landlord/property-listing/view-unit/${property.property_id}`
    );
  });
// @ts-ignore
  const handleAddProperty = () => {
    // @ts-ignore
    if (
        !isVerified ||
        !subscription ||
        subscription?.is_active !== 1 ||
        properties.length >= (subscription?.listingLimits?.maxProperties || 0)
    ) {
      return;
    }
    setIsNavigating(true);
    router.push(`/pages/landlord/property-listing/create-property`);
  };


// @ts-ignore
  // @ts-ignore
  const handleDelete = useCallback(
      async (propertyId, event) => {
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
              `/api/propertyListing/deletePropertyListing/${propertyId}`,
              {method: "DELETE"}
          );
          const data = await response.json();

          if (response.ok) {
            Swal.fire("Deleted!", "Property deleted successfully.", "success").then(
                () => {
                  fetchAllProperties(user?.landlord_id);
                }
            );
          } else {
            let errorMessage = "Failed to delete property.";
            if (data?.error === "Cannot delete property with active leases") {
              errorMessage =
                  "This property cannot be deleted because it has active leases.";
            }
            Swal.fire("Error!", errorMessage, "error");
          }
        } catch (error) {
          console.error("Error deleting property:", error);
          Swal.fire("Error!", "An error occurred while deleting.", "error");
        }
      },
      [user?.landlord_id, fetchAllProperties]
  );

  if (!user?.landlord_id) {
    return <p className="text-center mt-4">Loading...</p>;
  }
  if (loading) return <p className="text-center mt-4">Fetching properties...</p>;
  if (error) return <p className="text-center mt-4 text-red-500">{error}</p>;

  // @ts-ignore
  const isAddDisabled =
      isFetchingVerification ||
      fetchingSubscription ||
      verificationStatus !== "approved" || // ✅ Only approved allows adding
      !subscription ||
      subscription?.is_active !== 1 ||
      properties.length >= (subscription?.listingLimits?.maxProperties || 0) ||
      isNavigating;


  return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6">

          {!isFetchingVerification && (
              <div className="mb-6">
                {/* 1. ❌ No verification + no subscription */}
                {!verificationStatus && !subscription ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                          <p className="font-bold text-red-700">Account Setup Required</p>
                          <p className="text-sm text-red-600">
                            You must verify your landlord account and choose a subscription plan before listing properties.
                          </p>
                          <div className="mt-2 flex space-x-4">
                            <Link
                                href="/pages/landlord/verification"
                                className="text-blue-600 underline text-sm"
                            >
                              Verify Account
                            </Link>
                            <Link
                                href="/pages/landlord/sub_two/subscription"
                                className="text-blue-600 underline text-sm"
                            >
                              Choose a Plan
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                ) : verificationStatus === "pending" && !subscription ? (
                    /* 2. ⏳ Pending + no subscription */
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                          <p className="font-bold text-yellow-700">Verification Pending</p>
                          <p className="text-sm text-yellow-600">
                            Your account verification is under review. You can select a subscription plan now, but you’ll only be able to list properties once verified.
                          </p>
                          <Link
                              href="/pages/landlord/sub_two/subscription"
                              className="inline-block mt-2 text-blue-600 underline text-sm"
                          >
                            Choose a Plan
                          </Link>
                        </div>
                      </div>
                    </div>

                ) : verificationStatus === "pending" ? (
                    /* 2b. ⏳ Pending only (subscription exists) */
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                          <p className="font-bold text-yellow-700">Verification Pending</p>
                          <p className="text-sm text-yellow-600">
                            Your landlord verification is under review. You’ll be able to list properties once approved.
                          </p>
                        </div>
                      </div>
                    </div>

                ) : verificationStatus === "rejected" ? (
                    /* ❌ Rejected */
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                          <p className="font-bold text-red-700">Verification Rejected</p>
                          <p className="text-sm text-red-600">
                            Your landlord verification was rejected. Please resubmit your documents.
                          </p>
                          <Link
                              href="/pages/landlord/verification"
                              className="inline-block mt-2 text-blue-600 underline text-sm"
                          >
                            Resubmit Verification
                          </Link>
                        </div>
                      </div>
                    </div>

                ) : verificationStatus !== "approved" ? (
                    /* 3. Other statuses → Verification Required */
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                          <p className="font-bold text-red-700">Verification Required</p>
                          <p className="text-sm text-red-600">
                            Verify your landlord account before adding properties.
                          </p>
                          <Link
                              href="/pages/landlord/verification"
                              className="inline-block mt-2 text-blue-600 underline text-sm"
                          >
                            Verify Account
                          </Link>
                        </div>
                      </div>
                    </div>

                ) : !subscription || subscription?.is_active !== 1 ? (
                    /* 🟡 Approved but no/ inactive subscription */
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                          <p className="font-bold text-yellow-700">Subscription Required</p>
                          <p className="text-sm text-yellow-600">
                            You need an active subscription to list properties.
                          </p>
                          <Link
                              href="/pages/landlord/sub_two/subscription"
                              className="inline-block mt-2 text-blue-600 underline text-sm"
                          >
                            Choose a Plan
                          </Link>
                        </div>
                      </div>
                    </div>

                ) : properties.length >= (subscription?.listingLimits?.maxProperties || 0) ? (
                    /* 🟡 Property limit reached */
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                          <p className="font-bold text-yellow-700">Property Limit Reached</p>
                          <p className="text-sm text-yellow-600">
                            You’ve reached the maximum allowed properties (
                            {subscription?.listingLimits?.maxProperties ?? 0}). Upgrade your plan to add more.
                          </p>
                          <Link
                              href="/pages/landlord/sub_two/subscription"
                              className="inline-block mt-2 text-blue-600 underline text-sm"
                          >
                            Upgrade Plan
                          </Link>
                        </div>
                      </div>
                    </div>
                ) : null}
              </div>
          )}


          {/* Property Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BuildingOffice2Icon className="h-6 w-6 text-blue-600"/>
                <h1 className="text-2xl font-bold text-blue-600">
                  Property Listings
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {subscription && (
                    <p className="text-gray-600 text-sm hidden md:block">
                  <span className="font-medium">
                    {properties.length}/{subscription?.listingLimits?.maxProperties}
                  </span>{" "}
                      properties used
                    </p>
                )}
                <button
                    className={`flex items-center px-4 py-2 rounded-md font-bold transition-colors ${
                        isAddDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    onClick={handleAddProperty}
                    disabled={isAddDisabled}
                >
                  {isFetchingVerification || fetchingSubscription || isNavigating ? (
                      <span className="flex items-center">
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                      <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                      ></circle>
                      <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
                        5.291A7.962 7.962 0 014 12H0c0 3.042
                        1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                        {isNavigating ? "Redirecting..." : "Checking..."}
                  </span>
                  ) : (
                      <>
                        <PlusCircleIcon className="h-5 w-5 mr-2"/>
                        Add New Property
                      </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-gray-600">Manage your property listings and units</p>
          </div>

          {pendingApproval && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                <strong>Pending Approval:</strong> Some properties are under review.
                You cannot add units until they are verified.
              </div>
          )}

          {/* Properties List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2 text-blue-600"/>
              Your Properties
            </h2>
            {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <BuildingOffice2Icon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-2">No properties found.</p>
                  <button
                      className={`mt-2 flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                          isAddDisabled
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      onClick={handleAddProperty}
                      disabled={isAddDisabled || isFetchingVerification || fetchingSubscription || isNavigating}
                  >
                    {isFetchingVerification || fetchingSubscription || isNavigating ? (
                        <span className="flex items-center">
          <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
          >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
                 5.291A7.962 7.962 0 014 12H0c0 3.042
                 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
                          {isNavigating ? "Redirecting..." : "Checking..."}
        </span>
                    ) : (
                        <>
                          <PlusCircleIcon className="h-5 w-5 mr-2" />
                          Add Your First Property
                        </>
                    )}
                  </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property, index) => {
                    const isLocked =
                        subscription &&
                        index >= subscription?.listingLimits?.maxProperties;

                    return (
                        <div
                            key={property?.property_id}
                            className={`relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow h-full flex flex-col ${
                                isLocked ? "opacity-50 pointer-events-none" : "hover:shadow-md"
                            }`}
                        >
                          {isLocked && (
                              <div
                                  className="absolute inset-0 bg-gray-100 bg-opacity-75 flex flex-col items-center justify-center text-gray-500 font-semibold">
                                <p className="text-red-600 font-bold">
                                  Locked - Upgrade Plan
                                </p>
                                <Link
                                    href="/pages/landlord/sub_two/subscription"
                                    className="mt-2 text-blue-600 underline text-sm"
                                >
                                  Upgrade Subscription
                                </Link>
                              </div>
                          )}

                          <div className="h-48">
                            {property?.photos.length > 0 ? (
                                <Image
                                    src={property?.photos[0]?.photo_url}
                                    alt={property?.property_name}
                                    width={400}
                                    height={250}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <BuildingOffice2Icon className="h-12 w-12 text-gray-400"/>
                                </div>
                            )}
                          </div>

                          <div className="p-4 flex-1 flex flex-col">
                            <div className="mb-2 flex-1">
                              <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                                {property?.property_name}
                              </h3>
                              <div className="flex items-start text-gray-600 text-sm mb-2">
                                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5"/>
                                <p className="line-clamp-2">
                                  {property?.street}, {property?.city},{" "}
                                  {property?.province
                                      .split("_")
                                      .map(
                                          (w) => w.charAt(0).toUpperCase() + w.slice(1)
                                      )
                                      .join(" ")}
                                </p>
                              </div>
                              <span
                                  className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {property?.property_type.charAt(0).toUpperCase() +
                              property?.property_type.slice(1)}
                        </span>

                              <div className="flex items-center space-x-2 mt-2">
                          <span
                              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full 
                              ${
                                  property?.verification_status === "Verified"
                                      ? "bg-green-100 text-green-700"
                                      : property?.verification_status === "Pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : property?.verification_status === "Rejected"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {property?.verification_status || "Not Submitted"}
                          </span>

                                {property?.verification_status === "Rejected" &&
                                    property.attempts < 4 && (
                                        <button
                                            className="px-3 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                                            onClick={() =>
                                                router.push(
                                                    `/pages/landlord/property-listing/resubmit-verification/${property?.property_id}`
                                                )
                                            }
                                        >
                                          Resubmit ({4 - property.attempts} left)
                                        </button>
                                    )}

                                {property?.verification_status === "Rejected" &&
                                    property.attempts >= 4 && (
                                        <span
                                            className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md">
                                Max attempts reached
                              </span>
                                    )}
                              </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100">
                              <div className="flex justify-between">
                                <button
                                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                        property?.verification_status !== "Verified"
                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    }`}
                                    onClick={
                                      !isLocked &&
                                      property?.verification_status === "Verified"
                                          ? (event) => handleView(property, event)
                                          : undefined
                                    }
                                    disabled={
                                        isLocked ||
                                        property?.verification_status !== "Verified"
                                    }
                                >
                                  <HomeIcon className="h-4 w-4 mr-1"/>
                                  View Units
                                </button>

                                <div className="flex space-x-2">
                                  <button
                                      className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                                      onClick={
                                        !isLocked
                                            ? (event) =>
                                                handleEdit(property?.property_id, event)
                                            : undefined
                                      }
                                      disabled={isLocked}
                                  >
                                    <PencilSquareIcon className="h-4 w-4"/>
                                  </button>
                                  <button
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                      onClick={
                                        !isLocked
                                            ? (event) =>
                                                handleDelete(property?.property_id, event)
                                            : undefined
                                      }
                                      disabled={isLocked}
                                  >
                                    <TrashIcon className="h-4 w-4"/>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </LandlordLayout>
  );
}

export default PropertyListingPage;

