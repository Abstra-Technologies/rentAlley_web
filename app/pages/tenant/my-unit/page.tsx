"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { IoMailOpen } from "react-icons/io5";
import { MdRefresh } from "react-icons/md";
import { SparklesIcon } from "@heroicons/react/24/outline";

import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";

// Components
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import LoadingScreen from "@/components/loadingScreen";
import LeaseCounter from "@/components/tenant/analytics-insights/LeaseCounter";
import BillingCounter from "@/components/tenant/analytics-insights/BillingCounter";
import ApplicationsCounter from "@/components/tenant/analytics-insights/applicationsCounter";
import UnitCard from "@/components/tenant/currentRent/unitCard/activeRentCards";
import SearchAndFilter from "@/components/Commons/SearchAndFilterUnits";
import Pagination from "@/components/Commons/Pagination";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import EmptyState from "@/components/Commons/EmptyStateUnitSearch";
import RenewalRequestForm from "@/components/tenant/currentRent/RenewalRequestForm";

// Types & utils
import { Unit } from "@/types/units";
import { formatCurrency } from "@/utils/formatter/formatters";
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
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefetching, setIsRefetching] = useState(false);
  const itemsPerPage = 10;
  const [loadingRenewal, setLoadingRenewal] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  const { units, loading, error, refetch } = useUnits(user?.tenant_id);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const handleUploadProof = useCallback(
    async (unitId: string, agreementId: string, amountPaid: number) => {
      const { value: file } = await Swal.fire({
        title: "Upload Proof of Payment",
        input: "file",
        inputAttributes: {
          accept: "image/*,application/pdf",
          "aria-label": "Upload your payment proof",
        },
        showCancelButton: true,
        confirmButtonText: "Upload",
        customClass: {
          popup: "rounded-xl",
          confirmButton: "bg-gradient-to-r from-blue-500 to-emerald-500",
        },
      });

      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("unit_id", unitId);
      formData.append("tenant_id", user?.tenant_id || "");
      formData.append("agreement_id", agreementId);
      formData.append("amount_paid", String(amountPaid));

      try {
        const res = await axios.post(
          "/api/tenant/payment/uploadProofPayment",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (res.status === 200) {
          await Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Your proof of payment has been submitted!",
            customClass: { popup: "rounded-xl" },
          });
          refetch();
        } else {
          throw new Error("Upload failed");
        }
      } catch (err) {
        console.error(err);
        await Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: "Failed to upload proof of payment. Please try again.",
          customClass: { popup: "rounded-xl" },
        });
      }
    },
    [user?.tenant_id, refetch]
  );

  const handleUnitPayment = useCallback(
    async (unitId: string) => {
      const unit = units.find((u) => u.unit_id === unitId);
      if (!unit) {
        Swal.fire("Error", "Unit not found.", "error");
        return;
      }

      const items = [];
      if (!unit.is_security_deposit_paid) {
        items.push({
          name: "Security Deposit",
          type: "SECURITY_DEPOSIT",
          amount: Number(unit.sec_deposit),
        });
      }
      if (!unit.is_advance_payment_paid) {
        items.push({
          name: "Advance Payment",
          type: "ADVANCE_PAYMENT",
          amount: Number(unit.advanced_payment),
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      if (items.length === 0 || totalAmount <= 0) {
        Swal.fire(
          "No Payment Needed",
          "Both payments are already settled.",
          "info"
        );
        return;
      }

      const itemDescriptions = items.map((item) => item.name).join(" and ");
      const result = await Swal.fire({
        title: `Pay ${itemDescriptions}?`,
        text: `Pay ${formatCurrency(totalAmount)} for ${itemDescriptions}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Pay Now",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "rounded-xl",
          confirmButton: "bg-gradient-to-r from-green-500 to-emerald-500",
        },
      });

      if (!result.isConfirmed || !user) return;

      setLoadingPayment(true);

      try {
        const payload = {
          agreement_id: unit.agreement_id,
          items: items.map((item) => ({
            type: item.type,
            amount: item.amount,
          })),
          payment_method_id: 1,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          redirectUrl: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secSuccess`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secFailed`,
            cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secCancelled`,
          },
        };

        const response = await axios.post(
          "/api/tenant/initialPayment",
          payload
        );
        if (response.status === 200) {
          window.location.href = response.data.checkoutUrl;
        }
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "An error occurred during payment. Please try again.",
          customClass: { popup: "rounded-xl" },
        });
      } finally {
        setLoadingPayment(false);
      }
    },
    [units, user]
  );

  const handleContactLandlord = useCallback(() => {
    const landlordUserId = units?.[0]?.landlord_user_id;
    let landlordName = units?.[0]?.landlord_name || "Landlord";

    try {
      // 🧩 Attempt decryption if it looks like JSON (your encrypt/decrypt uses JSON.stringify)
      if (landlordName.startsWith("{") || landlordName.startsWith("[")) {
        landlordName = decryptData(JSON.parse(landlordName), process.env.ENCRYPTION_SECRET);
      }
    } catch (err) {
      console.warn("Failed to decrypt landlord name:", err);
    }

    if (!landlordUserId || !user?.user_id) {
      Swal.fire({
        icon: "error",
        title: "Unable to Contact",
        text: "Landlord information is not available.",
        customClass: { popup: "rounded-xl" },
      });
      return;
    }

    const chatRoom = `chat_${[user.user_id, landlordUserId].sort().join("_")}`;
    const setChatData = useChatStore.getState().setPreselectedChat;

    setChatData({
      chat_room: chatRoom,
      landlord_id: landlordUserId,
      name: landlordName, // ✅ decrypted before passing
      tenant_id: user.user_id,
    });

    Swal.fire({
      title: "Redirecting...",
      text: "Taking you to the chat room...",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: "rounded-xl" },
      didClose: () => router.push("/pages/tenant/chat"),
    });
  }, [units, user?.user_id, router]);
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
          customClass: { popup: "rounded-xl" },
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
            customClass: { popup: "rounded-xl" },
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
          customClass: { popup: "rounded-xl" },
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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav />

      <div className="flex-1 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-6 h-6 text-emerald-600" />
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    My Units
                  </h1>
                </div>
                <p className="text-gray-600 text-sm sm:text-base ml-8">
                  Manage your rental properties and track your leases
                </p>
              </div>

              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={handleRefresh}
                  disabled={isRefetching}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-all font-medium text-sm sm:text-base whitespace-nowrap disabled:opacity-50"
                  title="Refresh data"
                >
                  <MdRefresh
                    className={`text-lg ${isRefetching ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={handleViewInvitations}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 hover:shadow-lg text-white rounded-xl transition-all font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  <IoMailOpen className="text-lg" />
                  <span>Invitations</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 border border-gray-100">
              <LeaseCounter tenantId={user?.tenant_id} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 border border-gray-100">
              <ApplicationsCounter tenantId={user?.tenant_id} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 border border-gray-100 sm:col-span-2 lg:col-span-1">
              <BillingCounter tenantId={user?.tenant_id} />
            </div>
          </div>

          <div className="mb-8 sm:mb-10 bg-gradient-to-r from-transparent via-gray-200 to-transparent h-px"></div>

          {error && <ErrorBoundary error={error} onRetry={refetch} />}

          {!error && (
            <>
              <div className="mb-6 sm:mb-8">
                <SearchAndFilter
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  totalUnits={units.length}
                  filteredCount={filteredUnits.length}
                />
              </div>

              {filteredUnits.length === 0 ? (
                <EmptyState
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery("")}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 sm:p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Your Properties
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {filteredUnits.length}{" "}
                          {filteredUnits.length === 1
                            ? "property"
                            : "properties"}{" "}
                          found
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {paginatedUnits.map((unit) => (
                        <UnitCard
                          key={unit.unit_id}
                          unit={unit}
                          onPayment={handleUnitPayment}
                          onUploadProof={handleUploadProof}
                          onContactLandlord={handleContactLandlord}
                          onAccessPortal={handleAccessPortal}
                          loadingPayment={loadingPayment}
                          onEndContract={handleEndLease}
                          onRenewLease={(unitId, agreementId, renewalData) =>
                            setShowRenewalForm(unitId)
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={filteredUnits.length}
                      itemsPerPage={itemsPerPage}
                    />
                  )}
                </div>
              )}

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
      </div>
    </div>
  );
}
