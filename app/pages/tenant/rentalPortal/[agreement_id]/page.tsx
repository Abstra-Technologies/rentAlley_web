"use client";

import { useRouter, useParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { useEffect, useState } from "react";
import LeaseDurationTracker from "@/components/tenant/analytics-insights/LeaseAgreementWidget";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import PendingDocumentsWidget from "@/components/tenant/analytics-insights/PendingDocumentsWidget";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";
import MoveInChecklist from "@/components/tenant/currentRent/MoveInChecklist";
import axios from "axios";
import {
  ChevronRightIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import QuickActionButtons from "@/components/tenant/currentRent/QuickActionButtons";

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
  const [loadingUnitInfo, setLoadingUnitInfo] = useState(false);

  /* ===================== FETCH LOGIC ===================== */

  useEffect(() => {
    if (!agreementId) return;

    let mounted = true;
    const fetchUnitName = async () => {
      setLoadingUnitInfo(true);
      try {
        const response = await axios.get(
          `/api/tenant/activeRent/unitInfo?agreement_id=${agreementId}`
        );
        if (mounted) setUnitInfo(response.data || null);
      } catch (error) {
        console.error("Failed to fetch unit name:", error);
      } finally {
        if (mounted) setLoadingUnitInfo(false);
      }
    };
    fetchUnitName();
    return () => {
      mounted = false;
    };
  }, [agreementId]);

  useEffect(() => {
    if (!agreementId) return;

    let mounted = true;
    const fetchMoveInStatus = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/activeRent/moveInChecklistStatus?agreement_id=${agreementId}`
        );
        if (mounted) setShowMoveInChecklist(response.data.showButton || false);
      } catch (error) {
        console.error("Failed to fetch move-in checklist status:", error);
      }
    };
    fetchMoveInStatus();
    return () => {
      mounted = false;
    };
  }, [agreementId]);

  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

  return (
    <div className="pt-14">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -mx-3 sm:-mx-8">

        {/* ===================== HEADER ===================== */}
        <div className="top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

            {/* Breadcrumb */}
            <nav
              className="
                flex items-center gap-1.5 sm:gap-2
                text-xs sm:text-sm text-gray-600
                mb-2 sm:mb-3
                overflow-x-auto whitespace-nowrap scrollbar-hide
              "
            >
              <span className="text-gray-500 shrink-0">Portal</span>
              <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
              <span
                className="
                  font-semibold bg-gradient-to-r from-blue-600 to-emerald-600
                  bg-clip-text text-transparent
                  truncate max-w-[60%] sm:max-w-none
                "
              >
                {loadingUnitInfo
                  ? "Loading..."
                  : unitInfo?.property_name || "Dashboard"}
              </span>
            </nav>

            {/* Title */}
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <h1
                  className="
                    text-xl sm:text-2xl md:text-3xl font-bold 
                    text-gray-900 
                    leading-tight mb-0.5 sm:mb-1 
                    break-words
                  "
                >
                  {unitInfo?.property_name && unitInfo?.unit_name ? (
                    <>
                      <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        {unitInfo.property_name}
                      </span>

                      <span
                        className="
                          text-gray-600 ml-1.5 sm:ml-2 
                          text-sm sm:text-lg md:text-xl
                        "
                      >
                        {unitInfo.unit_name.toLowerCase().startsWith("unit")
                          ? unitInfo.unit_name
                          : `Unit ${unitInfo.unit_name}`}
                      </span>
                    </>
                  ) : (
                    "Unit Portal"
                  )}
                </h1>

                <p className="text-[11px] sm:text-sm text-gray-600 truncate">
                  Manage your tenancy, documents and payments from one place.
                </p>
              </div>             
            </div>
    
          </div>
        </div>

        {/* ===================== MAIN CONTENT ===================== */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-8">

          {/* Move-in Checklist */}
          {showMoveInChecklist && (
            <section className="w-full animate-fade-in">
              <MoveInChecklist agreement_id={agreementId} />
            </section>
          )}

          <QuickActionButtons agreement_id={agreementId} />


          {/* ===================== TENANCY OVERVIEW ===================== */}
          <section className="mt-4 sm:mt-8">

            {/* Section Header */}
            <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-4">
              <div className="p-1 sm:p-1.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-md">
                <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  Tenancy Overview
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-tight">
                  Your lease and payment summary
                </p>
              </div>
            </div>

            {/* Cards Grid */}
            <div
              className="
                grid 
                grid-cols-1 
                sm:grid-cols-2 
                lg:grid-cols-3 
                gap-3 sm:gap-4 lg:gap-6
              "
            >
              {/* Payment Due */}
              <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 sm:p-4 lg:p-6">
                  <PaymentDueWidget agreement_id={agreementId} />
                </div>
              </div>

              {/* Lease Duration */}
              <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 sm:p-4 lg:p-6">
                  <LeaseDurationTracker agreement_id={agreementId} />
                </div>
              </div>

              {/* Pending Documents */}
              <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 sm:p-4 lg:p-6">
                  <PendingDocumentsWidget agreement_id={agreementId} />
                </div>
              </div>
            </div>
          </section>

          {/* ===================== PROPERTY UPDATES ===================== */}
          <section className="mt-4 sm:mt-8">
            <div className="flex items-center gap-2 mb-3 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg">
                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-gray-900">
                  Property Updates
                </h2>
                <p className="text-[11px] sm:text-sm text-gray-600">
                  Latest announcements and notices
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm">
              <div className="p-4 sm:p-6">
                <AnnouncementWidget agreement_id={agreementId} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
