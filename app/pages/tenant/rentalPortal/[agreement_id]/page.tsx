"use client";
import { useRouter, useParams } from "next/navigation";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";
import useAuthStore from "../../../../../zustand/authStore";
import { useEffect, useState } from "react";
import LoadingScreen from "../../../../../components/loadingScreen";
import Announcements from "../../../../../components/annoucemen/announcement";
import LeaseDurationTracker from "../../../../../components/tenant/analytics-insights/LeaseAgreementWidget";
import TenantBillingTable from "../../../../../components/tenant/TenantBillingTable";
import TenantPendingPaymentWidget from "../../../../../components/tenant/PendingPaymentWidget";
import TenantPropertyChart from "../../../../../components/analytics/tenantAnalytics";
import axios from "axios";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import OverduePaymentWidget from "@/components/tenant/analytics-insights/overDuePayment";
import PaymentHistoryWidget from "@/components/tenant/analytics-insights/paymentHistoryWidget";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";
import MoveInChecklist from "@/components/tenant/currentRent/MoveInChecklist";

export default function RentPortalPage() {
  const { user, fetchSession } = useAuthStore();
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const [unitInfo, setUnitInfo] = useState<{
    unit_name: string;
    property_name: string;
  } | null>(null);
  const agreementId = params?.agreement_id;
  const [moveInStatus, setMoveInStatus] = useState<
    "pending" | "completed" | null
  >(null);
  const [loading, setLoading] = useState(false);
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
        setMoveInStatus(response.data.status); // expected 'pending' or 'completed'
        setShowMoveInChecklist(response.data.showButton || false);


      } catch (error) {
        console.error("Failed to fetch move-in checklist status:", error);
      }
    };
    if (agreementId) fetchMoveInStatus();
  }, [agreementId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600">
            You need to be logged in to access the Rent Portal.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    // @ts-ignore
    <TenantLayout agreement_id={agreementId}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Enhanced Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col space-y-2">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <span>Portal</span>
                <svg
                  className="w-4 h-4"
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
                <span className="text-blue-600 font-medium">
                  {unitInfo?.property_name
                    ? `${unitInfo.property_name}`
                    : "Unit Dashboard"}
                </span>
              </nav>

              {/* Main Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {unitInfo?.property_name ? (
                      <>
                        <span className="text-blue-600">
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
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Manage all your rental activities and stay updated with your
                    tenancy
                  </p>
                </div>

                {/* Status Badge */}
                <div className="mt-3 sm:mt-0 flex items-center">
                  <div className="flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Active Lease
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-6 space-y-8">
          {/* Move-in Checklist - Priority Section */}
          {showMoveInChecklist && (
              <section className="space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                    <svg
                        className="w-5 h-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Move-in Requirements
                    </h2>
                    <p className="text-sm text-gray-600">
                      Complete your move-in checklist to fully activate your portal
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 p-1">
                  <MoveInChecklist agreement_id={agreementId} />
                </div>
              </section>
          )}

          {/* Quick Stats Section */}
          <section className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Overview
                </h2>
                <p className="text-sm text-gray-600">
                  Your tenancy at a glance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden">
                <div className="p-1">
                  <LeaseDurationTracker agreement_id={agreementId} />
                </div>
              </div>

              <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-yellow-200 transition-all duration-300 overflow-hidden">
                <div className="p-1">
                  <PaymentDueWidget agreement_id={agreementId} />
                </div>
              </div>

              <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-200 transition-all duration-300 overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="p-1">
                  <OverduePaymentWidget agreement_id={agreementId} />
                </div>
              </div>
            </div>
          </section>

          {/* Detailed Information Section */}
          <section className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                <svg
                  className="w-5 h-5 text-purple-600"
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Details & History
                </h2>
                <p className="text-sm text-gray-600">
                  Payment history and important announcements
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <div
                  onClick={() =>
                      router.push(`/pages/tenant/paymentHistory/currentLeasePayment?agreement_id=${agreementId}`)
                  }
                  className="group relative bg-white rounded-xl shadow-sm border border-gray-200
             hover:shadow-md hover:border-green-200 transition-all duration-300
             overflow-hidden cursor-pointer"
              >
                {/* Widget content */}
                <div className="p-1">
                  <PaymentHistoryWidget agreement_id={agreementId} />
                </div>

                {/* Hover overlay — does NOT block interactions */}
                <div
                    className="absolute inset-0 flex items-center justify-center
               opacity-0 group-hover:opacity-100 transition-opacity duration-300
               pointer-events-none"
                >
    <span
        className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium
                 px-3 py-1 rounded-full shadow-md border border-gray-200"
    >
      View Payment History →
    </span>
                </div>
              </div>


              <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-300 overflow-hidden">
                <div className="p-1">
                  <AnnouncementWidget agreement_id={agreementId} />
                </div>
              </div>
            </div>
          </section>

          {/* Future Sections Placeholder */}
          <section className="hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* <TenantBillingTable tenant_id={tenantId || user?.tenant_id} />
              <Announcements user_id={user?.user_id} /> */}
            </div>

            <div className="mt-6">{/* <TenantPropertyChart /> */}</div>
          </section>
        </div>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-6 right-6 sm:hidden">
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </TenantLayout>
  );
}
