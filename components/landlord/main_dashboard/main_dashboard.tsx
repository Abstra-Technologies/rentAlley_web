"use client";

import { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";

// Light components
import PointsEarnedAlert from "@/components/Commons/alertPoints";
import LandlordProfileStatus from "../profile/LandlordProfileStatus";
import QuickActions from "./QuickActions";
import HeaderContent from "./headerContent";
import NewWorkOrderModal from "../maintenance_management/NewWorkOrderModal";
import LandlordPropertyMarquee from "@/components/landlord/main_dashboard/LandlordPropertyQuickView";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

const CardSkeleton = () => (
    <div className="h-[240px] rounded-xl bg-gray-100 animate-pulse" />
);

// --------------------------------------------------
// Heavy components (lazy + skeleton)
// --------------------------------------------------
const PaymentSummaryCard = dynamic(
    () => import("../analytics/PaymentSummaryCard"),
    { ssr: false, loading: CardSkeleton }
);

const PendingMaintenanceDonut = dynamic(
    () => import("../analytics/PendingMaintenanceDonut"),
    { ssr: false, loading: CardSkeleton }
);

const RevenuePerformanceChart = dynamic(
    () => import("../analytics/revenuePerformance"),
    { ssr: false, loading: CardSkeleton }
);

const TodayCalendar = dynamic(
    () => import("@/components/landlord/main_dashboard/TodayCalendar"),
    { ssr: false }
);

const PaymentList = dynamic(
    () => import("../tenantPayments"),
    { ssr: false }
);

const MobileLandlordDashboard = dynamic(
    () => import("@/components/landlord/main_dashboard/mobile_dashboard"),
    { ssr: false }
);

export default function LandlordMainDashboard() {
    const router = useRouter();
    const { user, loading } = useAuthStore();
    const landlordId = user?.landlord_id;

    /* ---------------- Greeting ---------------- */
    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return "Good Morning";
        if (h < 18) return "Good Afternoon";
        return "Good Evening";
    }, []);

    const displayName =
        user?.firstName || user?.companyName || user?.email || "Landlord";

    /* ---------------- Points Alert ---------------- */
    const prevPoints = useRef<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);

    if (!loading && user?.points != null) {
        if (
            prevPoints.current !== null &&
            user.points > prevPoints.current &&
            !showAlert
        ) {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 4000);
        }
        prevPoints.current = user.points;
    }

    /* ---------------- Warm subscription cache ---------------- */
    useSWR(
        landlordId ? `/api/landlord/subscription/active/${landlordId}` : null,
        fetcher,
        { dedupingInterval: 60_000, revalidateOnFocus: false }
    );

    /* ---------------- Modal ---------------- */
    const [showNewModal, setShowNewModal] = useState(false);

    return (
        <div className="pb-24 md:pb-6">
            <div className="px-4 md:px-6 pt-4 md:pt-6 space-y-5">

                {showAlert && <PointsEarnedAlert points={user?.points} />}

                <HeaderContent
                    greeting={greeting}
                    displayName={displayName}
                    landlordId={landlordId}
                />

                <LandlordProfileStatus landlord_id={landlordId} />

                <div className="flex justify-center">
                    <QuickActions
                        onAddProperty={() => router.push("/pages/landlord/property-listing/create-property")}
                        onInviteTenant={() => router.push("/pages/landlord/invite-tenant")}
                        onAnnouncement={() => router.push("/pages/landlord/announcement/create-announcement")}
                        onWorkOrder={() => setShowNewModal(true)}
                        onIncome={() => router.push("/pages/landlord/payouts")}
                    />
                </div>

                {/* ================= DESKTOP ================= */}
                <div className="hidden md:block space-y-4">

                    {/* Top Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            {landlordId ? (
                                <PaymentSummaryCard landlord_id={landlordId} />
                            ) : (
                                <CardSkeleton />
                            )}
                        </div>

                        <TodayCalendar landlordId={landlordId} />
                    </div>

                    {/* Middle Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <LandlordPropertyMarquee landlordId={landlordId} />

                        {landlordId ? (
                            <PendingMaintenanceDonut landlordId={landlordId} />
                        ) : (
                            <CardSkeleton />
                        )}

                        <PaymentList landlord_id={landlordId} />
                    </div>

                    {/* Heavy Revenue Chart (last) */}
                    {landlordId ? (
                        <RevenuePerformanceChart landlord_id={landlordId} />
                    ) : (
                        <CardSkeleton />
                    )}
                </div>

                {/* ================= MOBILE ================= */}
                <div className="md:hidden">
                    <MobileLandlordDashboard landlordId={landlordId} />
                </div>

                {showNewModal && (
                    <NewWorkOrderModal
                        landlordId={landlordId}
                        onClose={() => setShowNewModal(false)}
                        onCreated={() => setShowNewModal(false)}
                    />
                )}
            </div>
        </div>
    );
}
