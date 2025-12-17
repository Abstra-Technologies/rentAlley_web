"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import useAuthStore from "@/zustand/authStore";

// Light components
import PointsEarnedAlert from "@/components/Commons/alertPoints";
import LandlordProfileStatus from "../profile/LandlordProfileStatus";
import QuickActions from "./QuickActions";
import HeaderContent from "./headerContent";
import NewWorkOrderModal from "../maintenance_management/NewWorkOrderModal";

// Desktop-only components
import LandlordPropertyMarquee from "@/components/landlord/main_dashboard/LandlordPropertyQuickView";

// Heavy desktop analytics (lazy)
const PaymentSummaryCard = dynamic(
    () => import("../analytics/PaymentSummaryCard"),
    { ssr: false }
);

const PendingMaintenanceDonut = dynamic(
    () => import("../analytics/PendingMaintenanceDonut"),
    { ssr: false }
);

const TodayCalendar = dynamic(
    () => import("@/components/landlord/main_dashboard/TodayCalendar"),
    { ssr: false }
);

const PaymentList = dynamic(
    () => import("../tenantPayments"),
    { ssr: false }
);

const RevenuePerformanceChart = dynamic(
    () => import("../analytics/revenuePerformance"),
    { ssr: false }
);

// ✅ Mobile dashboard
const MobileLandlordDashboard = dynamic(
    () => import("@/components/landlord/main_dashboard/mobile_dashboard"),
    { ssr: false }
);

export default function LandlordMainDashboard() {
    const router = useRouter();
    const { user, loading } = useAuthStore();

    const landlordId = user?.landlord_id;

    /* ================= GREETING ================= */
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, []);

    const displayName =
        user?.firstName || user?.companyName || user?.email || "Landlord";

    /* ================= POINTS ALERT (SAFE EFFECT) ================= */
    const prevPointsRef = useRef<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (loading || user?.points == null) return;

        const prev = prevPointsRef.current;

        if (prev !== null && user.points > prev) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);
            return () => clearTimeout(timer);
        }

        prevPointsRef.current = user.points;
    }, [user?.points, loading]);

    /* ================= MODALS ================= */
    const [showNewModal, setShowNewModal] = useState(false);

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
                        landlordId={landlordId}
                    />
                </div>

                {/* PROFILE STATUS */}
                <div className="mb-4">
                    <LandlordProfileStatus landlord_id={landlordId} />
                </div>

                {/* QUICK ACTIONS */}
                <div className="mb-5 flex justify-center">
                    <QuickActions
                        onAddProperty={() =>
                            router.push("/pages/landlord/property-listing/create-property")
                        }
                        onInviteTenant={() =>
                            router.push("/pages/landlord/invite-tenant")
                        }
                        onAnnouncement={() =>
                            router.push("/pages/landlord/announcement/create-announcement")
                        }
                        onWorkOrder={() => setShowNewModal(true)}
                        onIncome={() => router.push("/pages/landlord/payouts")}
                    />
                </div>

                {/* ================= DESKTOP DASHBOARD ================= */}
                <div className="hidden md:block space-y-4">
                    {/* Top row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <PaymentSummaryCard landlord_id={landlordId} />
                        </div>

                        <div
                            className="cursor-pointer"
                            onClick={() =>
                                router.push("/pages/landlord/booking-appointment")
                            }
                        >
                            <TodayCalendar landlordId={landlordId} />
                        </div>
                    </div>

                    {/* Middle row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div
                            className="cursor-pointer"
                            onClick={() =>
                                router.push("/pages/landlord/property-listing")
                            }
                        >
                            <LandlordPropertyMarquee landlordId={landlordId} />
                        </div>

                        <div
                            className="cursor-pointer"
                            onClick={() =>
                                router.push("/pages/landlord/maintenance-request")
                            }
                        >
                            <PendingMaintenanceDonut landlordId={landlordId} />
                        </div>

                        <div
                            className="cursor-pointer"
                            onClick={() =>
                                router.push(
                                    "/pages/landlord/analytics/detailed/paymentLogs"
                                )
                            }
                        >
                            <PaymentList landlord_id={landlordId} />
                        </div>
                    </div>

                    {/* Revenue */}
                    <RevenuePerformanceChart landlord_id={landlordId} />
                </div>

                {/* ================= MOBILE DASHBOARD ================= */}
                <div className="block md:hidden">
                    <MobileLandlordDashboard landlordId={landlordId} />
                </div>

                {/* NEW WORK ORDER MODAL */}
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
