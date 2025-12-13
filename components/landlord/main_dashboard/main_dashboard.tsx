"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";

// Components
import PointsEarnedAlert from "@/components/Commons/alertPoints";
import LandlordProfileStatus from "../profile/LandlordProfileStatus";
import QuickActions from "./QuickActions";
import HeaderContent from "./headerContent";
import LandlordPropertyMarquee from "@/components/landlord/main_dashboard/LandlordPropertyQuickView";
import ProspectiveTenantsWidget from "../widgets/leads";
import PaymentSummaryCard from "../analytics/PaymentSummaryCard";
import MobileLandlordAnalytics from "@/components/landlord/mobile_layour/MobileLandlordAnalytics";
import PendingMaintenanceDonut from "../analytics/PendingMaintenanceDonut";
import NewWorkOrderModal from "../maintenance_management/NewWorkOrderModal";
import TodayCalendar from "@/components/landlord/main_dashboard/TodayCalendar";
import PaymentList from "../tenantPayments";

const RevenuePerformanceChart = dynamic(
  () => import("../analytics/revenuePerformance"),
  { ssr: false }
);

export default function LandlordMainDashboard() {
  const router = useRouter();
  const { user, fetchSession, loading } = useAuthStore();

  const [showAlert, setShowAlert] = useState(false);
  const prevPointsRef = useRef<number | null>(null);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  // Greeting logic
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"
    );
  }, []);

  // Fetch user session
  useEffect(() => {
    if (!user) fetchSession();
  }, [user]);

  // Points earned logic
  useEffect(() => {
    if (!loading && user?.points != null) {
      const prev = prevPointsRef.current;
      if (prev !== null && user.points > prev) {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 4000);
      }
      prevPointsRef.current = user.points;
    }
  }, [user?.points]);

  // CMS Header image
  useEffect(() => {
    axios
      .get(`/api/systemadmin/cms/imagesList?folder=upkyp/headers/landlord`)
      .then((res) =>
        setHeaderImage(res.data.resources?.[0]?.secure_url || null)
      )
      .catch(() => setHeaderImage(null));
  }, []);

  const displayName =
    user?.firstName || user?.companyName || user?.email || "Landlord";

  return (
    <div className="pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-4 md:pt-6">
        {/* POINTS ALERT */}
        {showAlert && <PointsEarnedAlert points={user?.points} />}

        {/* HEADER */}
        <div className="mb-5">
          <HeaderContent
            greeting={greeting}
            displayName={displayName}
            landlordId={user?.landlord_id}
          />
        </div>

        {/* PROFILE STATUS */}
        <div className="mb-4">
          <LandlordProfileStatus landlord_id={user?.landlord_id} />
        </div>

        {/* QUICK ACTIONS */}
        <div className="mb-5 flex justify-center">
          <QuickActions
            onAddProperty={() =>
              router.push("/pages/landlord/property-listing/create-property")
            }
            onInviteTenant={() => router.push("/pages/landlord/invite-tenant")}
            onAnnouncement={() =>
              router.push("/pages/landlord/announcement/create-announcement")
            }
            onWorkOrder={() => setShowNewModal(true)}
            onIncome={() => router.push("/pages/landlord/payouts")}
          />
        </div>

        {/* ===== DESKTOP SECTION ===== */}
        <div className="hidden md:block space-y-4">
          {/* TOP ANALYTICS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PaymentSummaryCard
                landlord_id={user?.landlord_id}
                onClick={() => router.push("/pages/landlord/payment-history")}
              />
            </div>

            <div>
              <TodayCalendar landlordId={user?.landlord_id} />
            </div>
          </div>

          {/* PROPERTY + MAINTENANCE + PAYMENTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* PROPERTIES QUICK VIEW */}
            <div
              className="cursor-pointer"
              onClick={() => router.push(`/pages/landlord/property-listing`)}
            >
              <LandlordPropertyMarquee landlordId={user?.landlord_id} />
            </div>

            {/* MAINTENANCE DONUT */}
            <div
              className="cursor-pointer"
              onClick={() => router.push(`/pages/landlord/tenant-activity`)}
            >
              <PendingMaintenanceDonut landlordId={user?.landlord_id} />
            </div>

            {/* RECENT PAYMENTS */}
            <div
              className="cursor-pointer"
              onClick={() => router.push(`/pages/landlord/payment-history`)}
            >
              <PaymentList landlord_id={user?.landlord_id} />
            </div>
          </div>

          {/* REVENUE PERFORMANCE */}
          <div>
            <RevenuePerformanceChart landlord_id={user?.landlord_id} />
          </div>
        </div>

        {/* ===== MOBILE SECTION ===== */}
        <div className="block md:hidden space-y-4">
          {/* Payment Summary - Mobile */}
          <div onClick={() => router.push("/pages/landlord/payment-history")}>
            <PaymentSummaryCard landlord_id={user?.landlord_id} />
          </div>

          {/* Today's Calendar - Mobile */}
          <div>
            <TodayCalendar landlordId={user?.landlord_id} />
          </div>

          {/* Properties Quick View - Mobile */}
          <div
            className="cursor-pointer"
            onClick={() => router.push(`/pages/landlord/property-listing`)}
          >
            <LandlordPropertyMarquee landlordId={user?.landlord_id} />
          </div>

          {/* Maintenance - Mobile */}
          <div
            className="cursor-pointer"
            onClick={() => router.push(`/pages/landlord/tenant-activity`)}
          >
            <PendingMaintenanceDonut landlordId={user?.landlord_id} />
          </div>

          {/* Recent Payments - Mobile */}
          <div
            className="cursor-pointer"
            onClick={() => router.push(`/pages/landlord/payment-history`)}
          >
            <PaymentList landlord_id={user?.landlord_id} />
          </div>

          {/* Revenue Performance - Mobile */}
          <div>
            <RevenuePerformanceChart landlord_id={user?.landlord_id} />
          </div>
        </div>

        {/* NEW WORK ORDER MODAL */}
        {showNewModal && (
          <NewWorkOrderModal
            landlordId={user?.landlord_id}
            onClose={() => setShowNewModal(false)}
            onCreated={(order) => setShowNewModal(false)}
          />
        )}
      </div>
    </div>
  );
}
