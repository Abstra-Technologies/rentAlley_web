"use client";

import { useState, useEffect, useRef, memo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import useAuthStore from "@/zustand/authStore";

// Light components (keep static)
import PointsEarnedAlert from "@/components/Commons/alertPoints";
import LandlordProfileStatus from "../profile/LandlordProfileStatus";
import QuickActions from "./QuickActions";
import HeaderContent from "./headerContent";
import LandlordPropertyMarquee from "@/components/landlord/main_dashboard/LandlordPropertyQuickView";
import NewWorkOrderModal from "../maintenance_management/NewWorkOrderModal";

// Heavy components (lazy)
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

export default function LandlordMainDashboard() {
    const router = useRouter();
    const { user, fetchSession, loading } = useAuthStore();

    const [showAlert, setShowAlert] = useState(false);
    const prevPointsRef = useRef<number | null>(null);
    const [greeting, setGreeting] = useState("");
    const [showNewModal, setShowNewModal] = useState(false);

    /* ---------------- Session ---------------- */
    useEffect(() => {
        if (!user && !loading) {
            fetchSession();
        }
    }, [user, loading, fetchSession]);

    useEffect(() => {
        const hour = new Date().getHours();
        setGreeting(
            hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"
        );
    }, []);

    useEffect(() => {
        if (!loading && user?.points != null) {
            const prev = prevPointsRef.current;
            if (prev !== null && user.points > prev) {
                setShowAlert(true);
                const t = setTimeout(() => setShowAlert(false), 4000);
                return () => clearTimeout(t);
            }
            prevPointsRef.current = user.points;
        }
    }, [user?.points, loading]);

    const landlordId = user?.landlord_id;
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

                {/* ================= DESKTOP ================= */}
                <div className="hidden md:block space-y-4">
                    {/* Top analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <PaymentSummaryCard
                                landlord_id={landlordId}
                            />
                        </div>
                        <div  onClick={() =>
                            router.push("/pages/landlord/booking-appointment")
                        }>
                            <TodayCalendar landlordId={landlordId} />

                        </div>
                    </div>

                    {/* Middle grid */}
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
                                router.push("/pages/landlord/analytics/detailed/paymentLogs")
                            }
                        >
                            <PaymentList landlord_id={landlordId} />
                        </div>
                    </div>

                    {/* Revenue */}
                    <RevenuePerformanceChart landlord_id={landlordId} />
                </div>

                {/* ================= MOBILE ================= */}
                <div className="block md:hidden space-y-4">
                    <div onClick={() => router.push("/pages/landlord/payment-history")}>
                        <PaymentSummaryCard landlord_id={landlordId} />
                    </div>

                    <TodayCalendar landlordId={landlordId} />

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
                            router.push("/pages/landlord/tenant-activity")
                        }
                    >
                        <PendingMaintenanceDonut landlordId={landlordId} />
                    </div>

                    <div
                        className="cursor-pointer"
                        onClick={() =>
                            router.push("/pages/landlord/analytics/detailed/paymentLogs")
                        }
                    >
                        <PaymentList landlord_id={landlordId} />
                    </div>

                    {/* Optional: remove on mobile if you want it faster */}
                    <RevenuePerformanceChart landlord_id={landlordId} />
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
