"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Building2,
  Plus,
  Search,
  AlertCircle,
  Clock,
  XCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import PropertyCard from "@/components/landlord/properties/propertyCards";
import Pagination from "@mui/material/Pagination";
import useSubscription from "@/hooks/landlord/useSubscription";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

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
  const { subscription, loadingSubscription } = useSubscription(
    user?.landlord_id
  );

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
      property?.street?.toLowerCase().includes(query) ||
      property?.city?.toLowerCase().includes(query) ||
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
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Account Setup Required
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Complete your account setup to start listing properties.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/pages/landlord/verification"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Verify Account
                </Link>
                <Link
                  href="/pages/landlord/subscription_plan/pricing"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
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
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Verification Under Review
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Your account verification is being reviewed. You'll be notified
                once approved.
              </p>
              {!subscription && (
                <Link
                  href="/pages/landlord/subscription_plan/pricing"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
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
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Verification Rejected
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Your verification was rejected. Please review and resubmit your
                documents.
              </p>
              <Link
                href="/pages/landlord/verification"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
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
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Subscription Required
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Purchase a plan to start listing properties and reach potential
                tenants.
              </p>
              <button
                onClick={() =>
                  router.push("/pages/landlord/subsciption_plan/pricing")
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all text-sm"
              >
                View Plans
                <ArrowRight className="w-4 h-4" />
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
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Property Limit Reached
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                You've reached your plan limit of{" "}
                {subscription?.listingLimits?.maxProperties} properties. Upgrade
                to add more listings.
              </p>
              <Link
                href="/pages/landlord/subscription_plan/pricing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg font-medium transition-all text-sm"
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Property Listings
              </h1>
              <p className="text-gray-600 text-sm">
                Manage your properties and attract tenants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {subscription && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-gray-600 font-medium block">
                      Properties
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {properties.length} /{" "}
                      {subscription?.listingLimits?.maxProperties}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          properties.length >=
                          subscription?.listingLimits?.maxProperties
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-blue-600 to-emerald-600"
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
                    <span className="text-[10px] text-gray-500 text-right">
                      {Math.round(
                        (properties.length /
                          subscription?.listingLimits?.maxProperties) *
                          100
                      )}
                      % used
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Add Property Button */}
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                isAddDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg"
              }`}
              onClick={handleAddProperty}
              disabled={isAddDisabled}
            >
              {isFetchingVerification || loadingSubscription || isNavigating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">
                    {isNavigating ? "Opening..." : "Loading..."}
                  </span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="text-sm">Add Property</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties by name, address, or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {/* Status Banner */}
        {!isFetchingVerification && getStatusBanner()}

        {/* Properties Grid */}
        <div className="mb-6">
          {currentProperties.length > 0 ? (
            <div className="flex flex-col gap-4">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {searchQuery ? "No matching properties" : "No properties yet"}
                </h3>
                <p className="text-sm text-gray-600 mb-5">
                  {searchQuery
                    ? "Try adjusting your search criteria to find what you're looking for."
                    : "Start building your property portfolio by adding your first listing."}
                </p>
                {!searchQuery && !isAddDisabled && (
                  <button
                    onClick={handleAddProperty}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Your First Property</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProperties.length > itemsPerPage && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
