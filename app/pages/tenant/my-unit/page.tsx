
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";

// Components
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import LoadingScreen from "@/components/loadingScreen";
import LeaseCounter from "@/components/tenant/analytics-insights/LeaseCounter";
import BillingCounter  from "@/components/tenant/analytics-insights/BillingCounter";
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
      const res = await axios.get(`/api/tenant/activeRent?tenantId=${tenantId}`);
      console.log(res);
      setUnits(res.data || []);
      console.log('my units: ', res.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to load units";
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
          const res = await axios.post("/api/tenant/payment/uploadProofPayment", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

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
          Swal.fire("No Payment Needed", "Both payments are already settled.", "info");
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

          const response = await axios.post("/api/tenant/initialPayment", payload);
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
    if (!units?.[0]?.landlord_id || !user?.user_id) {
      Swal.fire({
        icon: "error",
        title: "Unable to Contact",
        text: "Landlord information is not available.",
        customClass: { popup: "rounded-xl" },
      });
      return;
    }

    const chatRoom = `chat_${[user.user_id, units[0].landlord_id].sort().join("_")}`;
    const setChatData = useChatStore.getState().setPreselectedChat;
    setChatData({
      chat_room: chatRoom,
      landlord_id: units[0].landlord_id,
      name: units[0].landlord_name || "Landlord",
      tenant_id: user.tenant_id || null,
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
  }, [units, user?.user_id, user?.tenant_id, router]);

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
            setShowRenewalForm(null); // Close modal
          }
        } catch (error: any) {
          await Swal.fire({
            icon: "error",
            title: "Submission Failed",
            text: `Failed to submit renewal request: ${error.response?.data?.message || error.message}`,
            customClass: { popup: "rounded-xl" },
          });
        } finally {
          setLoadingRenewal(false);
        }
      },
      [user?.tenant_id, refetch]
  );

  const handleViewInvitations = useCallback(() => {
    router.push("/pages/tenant/viewInvites");
  }, [router]);

  if (loading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
          <LoadingScreen message="Just a moment, getting things ready..." />
        </div>
    );
  }

  return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <TenantOutsidePortalNav />

        <div className="flex-1 md:ml-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 mb-4">
                My Units
              </h1>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button
                    onClick={handleViewInvitations}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  View Invitations
                </button>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {/* Lease Counter */}
              <div
                  className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100
               rounded-2xl shadow-sm hover:shadow-md transition-all duration-300
               p-4 sm:p-6 flex flex-col items-center text-center"
              >
                <LeaseCounter tenantId={user?.tenant_id} />
              </div>

              {/* Applications Counter */}
              <div
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-100
               rounded-2xl shadow-sm hover:shadow-md transition-all duration-300
               p-4 sm:p-6 flex flex-col items-center text-center"
              >
                <ApplicationsCounter tenantId={user?.tenant_id} />
              </div>

              {/* Billing Counter */}
              <div
                  className="bg-gradient-to-br from-indigo-50 to-purple-100 border border-indigo-100
               rounded-2xl shadow-sm hover:shadow-md transition-all duration-300
               p-4 sm:p-6 flex flex-col items-center text-center"
              >
                <BillingCounter tenantId={user?.tenant_id} />
              </div>
            </div>


            <hr className="my-8 border-gray-300" />

            {error && <ErrorBoundary error={error} onRetry={refetch} />}

            {!error && (
                <>
                  <SearchAndFilter
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      totalUnits={units.length}
                      filteredCount={filteredUnits.length}
                  />

                  {filteredUnits.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <EmptyState
                            searchQuery={searchQuery}
                            onClearSearch={() => setSearchQuery("")}
                        />
                      </div>
                  ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 sm:p-6">
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
                                    onRenewLease={(unitId, agreementId, renewalData) =>
                                        setShowRenewalForm(unitId) // Open modal
                                    }
                                />
                            ))}
                          </div>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            totalItems={filteredUnits.length}
                            itemsPerPage={itemsPerPage}
                        />
                      </div>
                  )}
                  {showRenewalForm && (
                      <RenewalRequestForm
                          unit={units.find((u) => u.unit_id === showRenewalForm)!}
                          onSubmit={(renewalData) =>
                              handleRenewLease(
                                  showRenewalForm,
                                  units.find((u) => u.unit_id === showRenewalForm)!.agreement_id,
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
