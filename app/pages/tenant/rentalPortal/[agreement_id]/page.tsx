"use client";

import { useParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { useEffect, useState } from "react";
import LeaseDurationTracker from "@/components/tenant/analytics-insights/LeaseAgreementWidget";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import PendingDocumentsWidget from "@/components/tenant/analytics-insights/PendingDocumentsWidget";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";
import MoveInChecklist from "@/components/tenant/currentRent/MoveInChecklist";
import axios from "axios";
import {
  HomeIcon,
  ChartBarIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import QuickActionButtons from "@/components/tenant/currentRent/QuickActionButtons";

export default function RentPortalPage() {
  // Always run hooks unconditionally
  const { user, fetchSession } = useAuthStore();
  const params = useParams();

  // Params may be undefined on first render → valid
  const agreementId = params?.agreement_id;

  const [unitInfo, setUnitInfo] = useState<{
    unit_name: string;
    property_name: string;
  } | null>(null);

  const [showMoveInChecklist, setShowMoveInChecklist] = useState(false);
  const [loadingUnitInfo, setLoadingUnitInfo] = useState(true);

  // ===========================
  // Fetch Unit Info
  // ===========================
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoadingUnitInfo(true);
      try {
        const res = await axios.get(
          `/api/tenant/activeRent/unitInfo?agreement_id=${agreementId}`
        );
        if (mounted) setUnitInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch unit info:", err);
      } finally {
        if (mounted) setLoadingUnitInfo(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [agreementId]);

  // ===========================
  // Fetch Move-In Checklist
  // ===========================
  useEffect(() => {
    let mounted = true;
    async function fetchChecklist() {
      try {
        const res = await axios.get(
          `/api/tenant/activeRent/moveInChecklistStatus?agreement_id=${agreementId}`
        );
        if (mounted) {
          setShowMoveInChecklist(res.data.showButton || false);
        }
      } catch (err) {
        console.error("Failed to fetch move-in checklist:", err);
      }
    }

    fetchChecklist();
    return () => {
      mounted = false;
    };
  }, [agreementId]);

  // ===========================
  // Ensure Auth
  // ===========================
  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

  // ===========================
  // UI STATE
  // ===========================
  const missingAgreement = !agreementId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* If agreement_id missing → show placeholder, BUT DO NOT RETURN */}
      {missingAgreement && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading portal...</p>
          </div>
        </div>
      )}

      {/* ================= PROFESSIONAL HEADER ================= */}
      {!missingAgreement && (
        <div className="bg-white border-b border-gray-200">
          {/* Add padding-top on mobile to account for navbar */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-0 py-4 md:py-6">
            <div className="flex items-center justify-between">
              {/* Left: Property Info */}
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <HomeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  {loadingUnitInfo ? (
                    <div className="animate-pulse">
                      <div className="h-5 md:h-6 bg-gray-200 rounded w-36 md:w-48 mb-2"></div>
                      <div className="h-3 md:h-4 bg-gray-200 rounded w-24 md:w-32"></div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                        {unitInfo?.property_name || "Property Portal"}
                      </h1>
                      <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {unitInfo?.unit_name
                          ? unitInfo.unit_name.toLowerCase().startsWith("unit")
                            ? unitInfo.unit_name
                            : `Unit ${unitInfo.unit_name}`
                          : "Tenant Portal"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Right: User Welcome - Hidden on mobile */}
              {user && (
                <div className="hidden lg:block text-right">
                  <p className="text-sm text-gray-600">Welcome back,</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONTENT ===================== */}
      {!missingAgreement && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 pb-24 md:pb-8">
          {/* Move-In Checklist */}
          {showMoveInChecklist && (
            <MoveInChecklist agreement_id={agreementId} />
          )}

          {/* Quick Actions */}
          <QuickActionButtons agreement_id={agreementId} />

          {/* TENANCY OVERVIEW */}
          <section>
            <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
              <div className="p-1.5 md:p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-sm">
                <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  Tenancy Overview
                </h2>
                <p className="text-xs md:text-sm text-gray-600">
                  Your lease and payment summary
                </p>
              </div>
            </div>

            {/* WIDGETS GRID - Better spacing for larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4 md:p-5">
                  <PaymentDueWidget agreement_id={agreementId} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4 md:p-5">
                  <LeaseDurationTracker agreement_id={agreementId} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4 md:p-5">
                  <PendingDocumentsWidget agreement_id={agreementId} />
                </div>
              </div>
            </div>
          </section>

          {/* PROPERTY UPDATES */}
          <section>
            <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
              <div className="p-1.5 md:p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-sm">
                <MegaphoneIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  Property Updates
                </h2>
                <p className="text-xs md:text-sm text-gray-600">
                  Latest announcements and notices
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-4 md:p-5 lg:p-6">
                <AnnouncementWidget agreement_id={agreementId} />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
