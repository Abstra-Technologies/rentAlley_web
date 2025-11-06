"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import PropertyCard from "@/components/landlord/properties/propertyCards";
import FBShareButton from "@/components/landlord/properties/shareToFacebook";
import Pagination from "@mui/material/Pagination";
import { AlertCircle } from "lucide-react";
import useSubscription from "@/hooks/landlord/useSubscription";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import { FiArrowRight } from "react-icons/fi";

const PropertyListingPage: React.FC = () => {
  const router = useRouter();
  const { fetchSession, user } = useAuthStore();
  const { properties, fetchAllProperties, loading, error } = usePropertyStore();
  const [verificationStatus, setVerificationStatus] =
    useState<string>("not verified");
  const [isFetchingVerification, setIsFetchingVerification] =
    useState<boolean>(true);
  const [pendingApproval, setPendingApproval] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 9;
  const { subscription, loadingSubscription, errorSubscription } =
    useSubscription(user?.landlord_id);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) {
      fetchSession();
    }
  }, [user, fetchSession]);

  useEffect(() => {
    if (user?.landlord_id) {
      fetchAllProperties(user?.landlord_id);
    }
  }, [user?.landlord_id, fetchAllProperties]);

  useEffect(() => {
    if (properties.length > 0) {
      const hasUnverifiedProperties = properties.some(
        (property: any) =>
          property?.verification_status?.toLowerCase() !== "verified"
      );
      setPendingApproval(hasUnverifiedProperties);
    }
  }, [properties]);

  useEffect(() => {
    if (user?.userType !== "landlord") return;

    setVerificationStatus("");
    setIsFetchingVerification(true);

    const fetchVerificationAndSubscription = async () => {
      try {
        const verificationRes = await axios.get(
          `/api/landlord/verification-upload/status?user_id=${user?.user_id}`
        );
        const status =
          verificationRes.data.verification_status || "not verified";
        setVerificationStatus(status.toLowerCase());
      } catch (err) {
        console.error("[ERROR] Failed to fetch landlord verification:", err);
        setVerificationStatus("not verified");
      } finally {
        setIsFetchingVerification(false);
      }
    };
    fetchVerificationAndSubscription();
  }, [user]);

  const handleEdit = (
    propertyId: string | number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    router.push(`../landlord/property-listing/edit-property/${propertyId}`);
  };

  const handleView = useCallback(
    async (property: any, event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();

      try {
        const res = await fetch("/api/landlord/subscription/limits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            landlord_id: user?.landlord_id,
            property_id: property.property_id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          Swal.fire({
            icon: "error",
            title: "Access Denied",
            text:
              data.error ||
              `This property exceeds your plan limit (${data.maxAllowed} properties allowed).`,
            confirmButtonColor: "#ef4444",
          });
          return;
        }

        router.push(`/pages/landlord/properties/${property.property_id}`);
      } catch (err) {
        console.error("Error checking access:", err);
        Swal.fire("Error", "Unable to validate property access.", "error");
      }
    },
    [router, user]
  );

  const handleAddProperty = () => {
    if (verificationStatus !== "approved") {
      Swal.fire({
        title: "Verification Required",
        text: "Your account must be verified before adding a property.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!subscription) {
      Swal.fire({
        title: "No Subscription",
        text: "You need an active subscription to add properties.",
        icon: "info",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (subscription?.is_active !== 1) {
      Swal.fire({
        title: "Inactive Subscription",
        text: "Your subscription is not active. Please renew or upgrade.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (
      properties.length >= (subscription?.listingLimits?.maxProperties || 0)
    ) {
      Swal.fire({
        title: "Limit Reached",
        text: "You've reached the maximum number of properties allowed in your current plan.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (pendingApproval) {
      Swal.fire({
        title: "Pending Approval",
        text: "Some of your properties are still pending approval. You may add another, but approval may take longer.",
        icon: "info",
        confirmButtonColor: "#3b82f6",
      });
    }

    setIsNavigating(true);
    router.push(`/pages/landlord/property-listing/create-property`);
  };

  const handleDelete = useCallback(
    async (
      propertyId: string | number,
      event: React.MouseEvent<HTMLButtonElement>
    ) => {
      event.stopPropagation();
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to recover this property!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it!",
      });
      if (!result.isConfirmed) return;

      try {
        const response = await fetch(
          `/api/propertyListing/deletePropertyListing/${propertyId}`,
          { method: "DELETE" }
        );
        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            title: "Deleted!",
            text: "Property deleted successfully.",
            icon: "success",
            confirmButtonColor: "#10b981",
          }).then(() => {
            fetchAllProperties(user?.landlord_id);
          });
        } else {
          let errorMessage = "Failed to delete property.";
          if (data?.error === "Cannot delete property with active leases") {
            errorMessage =
              "This property cannot be deleted because it has active leases.";
          }
          Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
            confirmButtonColor: "#ef4444",
          });
        }
      } catch (error) {
        console.error("Error deleting property:", error);
        Swal.fire({
          title: "Error!",
          text: "An error occurred while deleting.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    },
    [user?.landlord_id, fetchAllProperties]
  );

  const isAddDisabled =
    isFetchingVerification ||
    loadingSubscription ||
    verificationStatus !== "approved" ||
    !subscription ||
    subscription?.is_active !== 1 ||
    properties.length >= (subscription?.listingLimits?.maxProperties || 0) ||
    isNavigating;

  const filteredProperties = properties.filter((property: any) => {
    const query = searchQuery.toLowerCase();
    return (
      property?.property_name?.toLowerCase().includes(query) ||
      property?.address?.toLowerCase().includes(query) ||
      property?.property_id?.toString().includes(query)
    );
  });

  const startIndex = (page - 1) * itemsPerPage;
  const currentProperties = filteredProperties.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBanner = () => {
    if (!verificationStatus && !subscription) {
      return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
                Account Setup Required
              </h3>
              <p className="text-sm sm:text-base text-red-700 mb-3 sm:mb-4">
                Complete your account setup to start listing properties and
                attracting tenants.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Link
                  href="/pages/landlord/verification"
                  className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  Verify Account
                </Link>
                <Link
                  href="/pages/landlord/subscription_plan/pricing"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  Choose Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (verificationStatus === "pending") {
      return (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                Verification Under Review
              </h3>
              <p className="text-sm sm:text-base text-yellow-700 mb-2">
                Your account verification is being reviewed. You'll be notified
                once approved.
              </p>
              {!subscription && (
                <Link
                  href="/pages/landlord/subscription_plan/pricing"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  Choose a Plan
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (verificationStatus === "rejected") {
      return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
                Verification Rejected
              </h3>
              <p className="text-sm sm:text-base text-red-700 mb-3 sm:mb-4">
                Your verification was rejected. Please review and resubmit your
                documents.
              </p>
              <Link
                href="/pages/landlord/verification"
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                Resubmit Documents
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (!subscription || subscription?.is_active !== 1) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              <BuildingOffice2Icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">
                Subscription Required
              </h3>
              <p className="text-sm sm:text-base text-blue-700 mb-3 sm:mb-4">
                Purchase a plan to start listing properties and reach potential
                tenants.
              </p>
              <button
                onClick={() =>
                  router.push("/pages/landlord/subscription_plan/pricing")
                }
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 text-sm"
              >
                View Plans
                <FiArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (
      properties.length >= (subscription?.listingLimits?.maxProperties || 0)
    ) {
      return (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-orange-800 mb-2">
                Property Limit Reached
              </h3>
              <p className="text-sm sm:text-base text-orange-700 mb-3 sm:mb-4">
                You've reached your plan limit of{" "}
                {subscription?.listingLimits?.maxProperties} properties. Upgrade
                to add more listings.
              </p>
              <Link
                href="/pages/landlord/subscription_plan/pricing"
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white rounded-lg font-medium transition-all duration-200 text-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (error) {
    return (
        <ErrorBoundary
          error={
            error.message ||
            "Failed to load data. Please check your internet connection or try again."
          }
          onRetry={() => window.location.reload()}
        />
    );
  }

  if (!user?.landlord_id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
        <LoadingScreen message="Just a moment, getting things ready..." />
      </div>
    );
  }

  if (loading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <LoadingScreen message="Fetching your properties, please wait..." />
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">

        <div className="p-3 pt-16 pb-20 sm:p-6 md:pt-6 md:pb-6 lg:py-8 lg:pr-8">
          {/* Status Banner */}
          {!isFetchingVerification && getStatusBanner()}

            {/* Header + Search Container */}
            <div className="sticky top-0 z-30 bg-gradient-to-b from-white/95 to-white/85 backdrop-blur-md border-b border-gray-200">
                {/* Header Section */}
                <div className="bg-white rounded-none shadow-none border-b border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 sm:px-8 py-5 sm:py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex-shrink-0">
                                <BuildingOffice2Icon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                    Property Listings
                                </h1>
                                <p className="text-blue-100 text-sm sm:text-base">
                                    Manage your properties and attract tenants
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            {subscription && (
                                <div className="flex flex-col items-end">
            <span className="text-white/90 text-sm mb-1">
              Properties: {properties.length}/
                {subscription?.listingLimits?.maxProperties}
            </span>
                                    <div className="w-40 h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                properties.length >=
                                                subscription?.listingLimits?.maxProperties
                                                    ? "bg-red-400"
                                                    : "bg-green-400"
                                            }`}
                                            style={{
                                                width: `${Math.min(
                                                    (properties.length /
                                                        subscription?.listingLimits?.maxProperties) *
                                                    100,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 ${
                                    isAddDisabled
                                        ? "bg-white/20 text-white/50 cursor-not-allowed"
                                        : "bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl"
                                }`}
                                onClick={handleAddProperty}
                                disabled={isAddDisabled}
                            >
                                {isFetchingVerification || loadingSubscription || isNavigating ? (
                                    <>
                                        <svg
                                            className="animate-spin h-4 w-4"
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
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        <span>{isNavigating ? "Opening..." : "Loading..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusCircleIcon className="h-5 w-5" />
                                        <span>Add Property</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white border-t border-gray-100 p-4 sm:p-5 shadow-sm">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search properties by name, address, or ID..."
                                className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition"
                            />
                        </div>
                    </div>
                </div>
            </div>


            {/* Properties Grid */}
          <div className="mb-8">
            {currentProperties.length > 0 ? (
                <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
                    {currentProperties.map((property: any, idx: number) => {
                        const globalIndex = startIndex + idx;
                        return (
                            <PropertyCard
                                key={property.property_id}
                                property={property}
                                index={globalIndex}
                                subscription={subscription}
                                totalProperties={filteredProperties.length}
                                handleView={handleView}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                            />
                        );
                    })}
                </div>

            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <BuildingOffice2Icon className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery
                      ? "No matching properties"
                      : "No properties yet"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery
                      ? "Try adjusting your search criteria to find what you're looking for."
                      : "Start building your property portfolio by adding your first listing."}
                  </p>
                  {!searchQuery && !isAddDisabled && (
                    <button
                      onClick={handleAddProperty}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                      <span>Add Your First Property</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredProperties.length > itemsPerPage && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
              <div className="flex justify-center">
                <Pagination
                  count={Math.ceil(filteredProperties.length / itemsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  size="large"
                />
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default PropertyListingPage;
