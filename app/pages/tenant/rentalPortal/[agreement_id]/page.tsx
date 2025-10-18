"use client";
import { useRouter, useParams } from "next/navigation";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";
import useAuthStore from "../../../../../zustand/authStore";
import { useEffect, useState } from "react";
import LeaseDurationTracker from "../../../../../components/tenant/analytics-insights/LeaseAgreementWidget";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import OverduePaymentWidget from "@/components/tenant/analytics-insights/overDuePayment";
import PaymentHistoryWidget from "@/components/tenant/analytics-insights/paymentHistoryWidget";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";
import MoveInChecklist from "@/components/tenant/currentRent/MoveInChecklist";
import axios from "axios";

export default function RentPortalPage() {
  const { user, fetchSession } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const [unitInfo, setUnitInfo] = useState<{
    unit_name: string;
    property_name: string;
  } | null>(null);
  const agreementId = params?.agreement_id;
  const [showMoveInChecklist, setShowMoveInChecklist] = useState(false);

  useEffect(() => {
    const fetchUnitName = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/activeRent/unitInfo?agreement_id=${agreementId}`
        );
        setUnitInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch unit name:", error);
      }
    };
    if (agreementId) fetchUnitName();
  }, [agreementId]);

  useEffect(() => {
    const fetchMoveInStatus = async () => {
      if (!agreementId) return;
      try {
        const response = await axios.get(
          `/api/tenant/activeRent/moveInChecklistStatus?agreement_id=${agreementId}`
        );
        setShowMoveInChecklist(response.data.showButton || false);
      } catch (error) {
        console.error("Failed to fetch move-in checklist status:", error);
      }
    };
    if (agreementId) fetchMoveInStatus();
  }, [agreementId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4">
        <div className="text-center p-6 sm:p-8 bg-white rounded-2xl shadow-lg border border-blue-100 w-full max-w-sm">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            You need to be logged in to access your rental portal.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <TenantLayout agreement_id={agreementId}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
        {/* Header - Mobile Optimized */}
        <div className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-40">
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
                <span className="text-gray-500 whitespace-nowrap">Portal</span>
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-medium bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
                  {unitInfo?.property_name || "Dashboard"}
                </span>
              </nav>

              {/* Main Title & Status */}
              <div className="flex flex-col gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {unitInfo?.property_name && unitInfo?.unit_name ? (
                      <>
                        <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                          {unitInfo.property_name}
                        </span>
                        <span className="text-gray-600 text-xl sm:text-2xl ml-2">
                          Unit {unitInfo.unit_name}
                        </span>
                      </>
                    ) : (
                      "Unit Portal"
                    )}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Manage your tenancy and payments
                  </p>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-full w-fit">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-emerald-700 text-xs sm:text-sm">
                    Active Lease
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-4 sm:px-6 sm:py-8 space-y-6 sm:space-y-8 pb-8">
          {/* Move-in Checklist Section */}
          {showMoveInChecklist && (
            <section>
              <MoveInChecklist agreement_id={agreementId} />
            </section>
          )}

          {/* Quick Stats Section */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Overview
                </h2>
                <p className="text-xs text-gray-600">Your tenancy summary</p>
              </div>
            </div>

            {/* Cards - Single column on mobile, stacked responsive */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300 min-h-64">
                <div className="p-4 sm:p-6 h-full">
                  <LeaseDurationTracker agreement_id={agreementId} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300 min-h-64">
                  <div className="p-4 sm:p-6 h-full">
                    <PaymentDueWidget agreement_id={agreementId} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300 min-h-64">
                  <div className="p-4 sm:p-6 h-full">
                    <OverduePaymentWidget agreement_id={agreementId} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Details Section */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Details & History
                </h2>
                <p className="text-xs text-gray-600">Payments and updates</p>
              </div>
            </div>

            {/* Cards Stack */}
            <div className="space-y-4">
              <div
                onClick={() =>
                  router.push(
                    `/pages/tenant/paymentHistory/currentLeasePayment?agreement_id=${agreementId}`
                  )
                }
                className="group relative bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300 min-h-64 cursor-pointer overflow-hidden"
              >
                <div className="p-4 sm:p-6 h-full">
                  <PaymentHistoryWidget agreement_id={agreementId} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-blue-600/5 to-emerald-600/5">
                  <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-blue-200">
                    View Details →
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300 min-h-64">
                <div className="p-4 sm:p-6 h-full">
                  <AnnouncementWidget agreement_id={agreementId} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </TenantLayout>
  );
}
