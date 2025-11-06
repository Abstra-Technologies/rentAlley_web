"use client";
import { useRouter, useParams } from "next/navigation";
import TenantLayout from "@/components/navigation/sidebar-tenant";
import useAuthStore from "@/zustand/authStore";
import { useEffect, useState } from "react";
import LeaseDurationTracker from "@/components/tenant/analytics-insights/LeaseAgreementWidget";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import PaymentHistoryWidget from "@/components/tenant/analytics-insights/paymentHistoryWidget";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";
import MoveInChecklist from "@/components/tenant/currentRent/MoveInChecklist";
import axios from "axios";
import {
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-blue-600"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access your rental portal.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <TenantLayout agreement_id={agreementId}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -m-4 md:-m-8">
        {/* Top Header Bar - Sticky */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <span className="text-gray-500">Portal</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {unitInfo?.property_name || "Dashboard"}
              </span>
            </nav>

            {/* Title Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {unitInfo?.property_name && unitInfo?.unit_name ? (
                    <>
                      <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        {unitInfo.property_name}
                      </span>
                      <span className="text-gray-600 text-xl sm:text-2xl ml-2">
                        {unitInfo.unit_name.toLowerCase().startsWith("unit")
                          ? unitInfo.unit_name
                          : `Unit ${unitInfo.unit_name}`}
                      </span>
                    </>
                  ) : (
                    "Unit Portal"
                  )}
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your tenancy and payments
                </p>
              </div>

              {/* Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-emerald-700 text-sm">
                  Active Lease
                </span>
              </div>
            </div>

            {/* Mobile Status Badge */}
            <div className="sm:hidden mt-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-emerald-700 text-xs">
                  Active Lease
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Move-in Checklist Section */}
          {showMoveInChecklist && (
            <section className="animate-fade-in">
              <MoveInChecklist agreement_id={agreementId} />
            </section>
          )}

          {/* Overview Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Tenancy Overview
                </h2>
                <p className="text-sm text-gray-600">
                  Your lease and payment summary
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Payment Due */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-200 transition-all duration-300">
                <div className="p-6">
                  <PaymentDueWidget agreement_id={agreementId} />
                </div>
              </div>

              {/* Overdue Payment */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-200 transition-all duration-300">
                <div className="p-6">
                    <LeaseDurationTracker agreement_id={agreementId} />
                </div>
              </div>

              {/* Payment History - Spans 1 col, positioned nicely */}
              <div
                onClick={() =>
                  router.push(
                    `/pages/tenant/paymentHistory/currentLeasePayment?agreement_id=${agreementId}`
                  )
                }
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <PaymentHistoryWidget agreement_id={agreementId} />
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
                  <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-sm font-bold px-4 py-2 rounded-full shadow-lg border border-blue-200">
                    View Full History →
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Announcements Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Property Updates
                </h2>
                <p className="text-sm text-gray-600">
                  Latest announcements and notices
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-300">
              <div className="p-6">
                <AnnouncementWidget agreement_id={agreementId} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </TenantLayout>
  );
}
