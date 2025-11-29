"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  HomeIcon,
  EnvelopeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";

// Components
import LoadingScreen from "@/components/loadingScreen";
import UnitCard from "@/components/tenant/currentRent/unitCard/activeRentCards";
import SearchAndFilter from "@/components/Commons/SearchAndFilterUnits";
import Pagination from "@/components/Commons/Pagination";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import EmptyState from "@/components/Commons/EmptyStateUnitSearch";
import RenewalRequestForm from "@/components/tenant/currentRent/RenewalRequestForm";

// Types & utils
import { Unit } from "@/types/units";
import { decryptData } from "@/crypto/encrypt";

// Hook to fetch units
const useUnits = (tenantId: string | undefined) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `/api/tenant/activeRent?tenantId=${tenantId}`
      );
      setUnits(res.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to load units";
      setError(errorMessage);
      console.error("Error fetching units:", err);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return { units, loading, error, refetch: fetchUnits };
};

export default function MyUnit() {
  // @ts-ignore
  const { user, admin, fetchSession } = useAuthStore();
  const router = useRouter();
  const [showRenewalForm, setShowRenewalForm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefetching, setIsRefetching] = useState(false);
  const itemsPerPage = 9; // Changed to 9 for better grid layout (3x3)
  const [loadingRenewal, setLoadingRenewal] = useState(false);
  const { units, loading, error, refetch } = useUnits(user?.tenant_id);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { filteredUnits, paginatedUnits, totalPages } = useMemo(() => {
    const filtered = units.filter((unit) => {
      const query = searchQuery.toLowerCase();
      return (
        unit.unit_name.toLowerCase().includes(query) ||
        unit.property_name.toLowerCase().includes(query) ||
        unit.city.toLowerCase().includes(query) ||
        unit.province.toLowerCase().includes(query)
      );
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filteredUnits: filtered, paginatedUnits: paginated, totalPages };
  }, [units, searchQuery, currentPage, itemsPerPage]);

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  }, [refetch]);

  const handleContactLandlord = useCallback(() => {
    const landlordId = units?.[0]?.landlord_id;
    const landlordUserId = units?.[0]?.landlord_user_id;
    let landlordName = units?.[0]?.landlord_name || "Landlord";

    try {
      if (landlordName.startsWith("{") || landlordName.startsWith("[")) {
        landlordName = decryptData(
          JSON.parse(landlordName),
          process.env.ENCRYPTION_SECRET
        );
      }
    } catch (err) {
      console.warn("Failed to decrypt landlord name:", err);
    }

    if (!landlordId || !user?.tenant_id) {
      Swal.fire({
        icon: "error",
        title: "Unable to Contact",
        text: "Landlord information is not available.",
      });
      return;
    }

    const chatRoom = `chat_${[user.user_id, landlordUserId].sort().join("_")}`;
    const setChatData = useChatStore.getState().setPreselectedChat;

    setChatData({
      chat_room: chatRoom,
      landlord_id: landlordId,
      tenant_id: user.tenant_id,
      name: landlordName,
    });

    Swal.fire({
      title: "Redirecting...",
      text: "Taking you to the chat room...",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
      didClose: () => router.push("/pages/tenant/chat"),
    });
  }, [units, user, router]);

  const handleAccessPortal = useCallback(
    (agreementId: string) => {
      router.push(`/pages/tenant/rentalPortal/${agreementId}`);
    },
    [router]
  );

  const handleRenewLease = useCallback(
    async (unitId: string, agreementId: string, renewalData: any) => {
      if (!user?.tenant_id) {
        Swal.fire({
          icon: "error",
          title: "Authentication Error",
          text: "User not authenticated.",
        });
        return;
      }

      setLoadingRenewal(true);
      try {
        const response = await axios.post("/api/tenant/renewal-request", {
          tenant_id: user.tenant_id,
          unit_id: unitId,
          agreement_id: agreementId,
          requested_start_date: renewalData.requested_start_date,
          requested_end_date: renewalData.requested_end_date,
          requested_rent_amount: renewalData.requested_rent_amount,
          notes: renewalData.notes,
        });

        if (response.status === 200) {
          await Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Your renewal request has been submitted!",
          });
          setShowRenewalForm(null);
          refetch();
        }
      } catch (error: any) {
        await Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: `Failed to submit renewal request: ${
            error.response?.data?.message || error.message
          }`,
        });
      } finally {
        setLoadingRenewal(false);
      }
    },
    [user?.tenant_id, refetch]
  );

  const handleEndLease = useCallback(
    async (unitId: string, agreementId: string) => {
      if (!user?.tenant_id) {
        Swal.fire("Unauthorized", "Please log in first.", "error");
        return;
      }

      const confirm = await Swal.fire({
        title: "End Lease Agreement?",
        text: "This action cannot be undone. Your landlord will be notified.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, End Lease",
      });

      if (!confirm.isConfirmed) return;

      try {
        const res = await fetch("/api/tenant/activeRent/endLease", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: user.tenant_id,
            agreement_id: agreementId,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          await Swal.fire({
            icon: "success",
            title: "Lease Ended Successfully",
            text: data.message || "Your landlord has been notified.",
            confirmButtonText: "Continue",
            confirmButtonColor: "#10B981",
          });

          router.push(`/pages/tenant/feedback?agreement_id=${agreementId}`);
        } else {
          await Swal.fire({
            icon: "error",
            title: "Unable to End Lease",
            text:
              data.error ||
              "Please settle all pending payments before ending your lease.",
            confirmButtonColor: "#d33",
          });
        }
      } catch (err) {
        console.error("Error ending lease:", err);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong. Please try again later.",
        });
      }
    },
    [user?.tenant_id, refetch, router]
  );

  const handleViewInvitations = useCallback(() => {
    router.push("/pages/tenant/viewInvites");
  }, [router]);

  if (loading) {
    return <LoadingScreen message="Just a moment, getting things ready..." />;
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <HomeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              My Units
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Manage your active rentals
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleViewInvitations}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:shadow-md transition-all"
          >
            <EnvelopeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Invitations</span>
          </button>
        </div>
      </header>

      {/* Error State */}
      {error && <ErrorBoundary error={error} onRetry={refetch} />}

      {/* Main Content */}
      {!error && (
        <>
          {/* Analytics Section */}
          {/* <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <LeaseCounter tenantId={user?.tenant_id} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <ApplicationsCounter tenantId={user?.tenant_id} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <BillingCounter tenantId={user?.tenant_id} />
              </div>
            </div>
          </div> */}

          {/* Search & Filter */}
          <div className="mb-6">
            <SearchAndFilter
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              totalUnits={units.length}
              filteredCount={filteredUnits.length}
            />
          </div>

          {/* Empty State */}
          {filteredUnits.length === 0 ? (
            <EmptyState
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
            />
          ) : (
            <>
              {/* Results Summary */}
              {units.length > 0 && (
                <div className="flex items-center justify-between mb-5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-700">
                      {filteredUnits.length}{" "}
                      {filteredUnits.length === 1 ? "property" : "properties"}
                    </p>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <p className="text-xs text-gray-500">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                </div>
              )}

              {/* Units Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-6">
                {paginatedUnits.map((unit) => (
                  <UnitCard
                    key={unit.unit_id}
                    unit={unit}
                    onContactLandlord={handleContactLandlord}
                    onAccessPortal={handleAccessPortal}
                    onEndContract={handleEndLease}
                    onRenewLease={(unitId, agreementId, renewalData) =>
                      setShowRenewalForm(unitId)
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mb-20 sm:mb-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={filteredUnits.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Renewal Form Modal */}
          {showRenewalForm && (
            <RenewalRequestForm
              unit={units.find((u) => u.unit_id === showRenewalForm)!}
              onSubmit={(renewalData) =>
                handleRenewLease(
                  showRenewalForm,
                  units.find((u) => u.unit_id === showRenewalForm)!
                    .agreement_id,
                  renewalData
                )
              }
              onClose={() => setShowRenewalForm(null)}
              loading={loadingRenewal}
            />
          )}
        </>
      )}
    </div>
  );
}