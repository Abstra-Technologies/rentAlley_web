"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";

// Light components
import PointsEarnedAlert from "@/components/Commons/alertPoints";
import QuickActions from "./QuickActions";
import HeaderContent from "./headerContent";
import NewWorkOrderModal from "../maintenance_management/NewWorkOrderModal";
import LeaseOccupancyCard from "./LeaseOccupancyCard";
import EndingLeaseCard from "@/components/landlord/main_dashboard/EndingLeaseCard";
import LandlordSetupBanner from "@/components/landlord/main_dashboard/LandlordSetupBanner";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const CardSkeleton = () => (
    <div className="h-[240px] rounded-xl bg-gray-100 animate-pulse" />
);

// Heavy components
const PaymentSummaryCard = dynamic(
    () => import("../analytics/PaymentSummaryCard"),
    { ssr: false, loading: () => <CardSkeleton /> }
);

const PendingMaintenanceDonut = dynamic(
    () => import("../analytics/PendingMaintenanceDonut"),
    { ssr: false, loading: () => <CardSkeleton /> }
);

const RevenuePerformanceChart = dynamic(
    () => import("../analytics/revenuePerformance"),
    { ssr: false, loading: () => <CardSkeleton /> }
);

const TodayCalendar = dynamic(
    () => import("@/components/landlord/main_dashboard/TodayCalendar"),
    { ssr: false, loading: () => <CardSkeleton /> }
);

const MobileLandlordDashboard = dynamic(
    () => import("@/components/landlord/main_dashboard/mobile_dashboard"),
    { ssr: false, loading: () => null }
);

interface Props {
    landlordId: string;
}

export default function LandlordMainDashboard({ landlordId }: Props) {
    const router = useRouter();
    const { user } = useAuthStore();

    /* ---------------- Greeting ---------------- */
    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return "Good Morning";
        if (h < 18) return "Good Afternoon";
        return "Good Evening";
    }, []);

    const displayName = useMemo(
        () => user?.firstName || user?.companyName || user?.email || "Landlord",
        [user?.firstName, user?.companyName, user?.email]
    );

    /* ---------------- Points Earned Alert ---------------- */
    const prevPoints = useRef<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (user?.points == null) {
            prevPoints.current = null;
            return;
        }

        if (
            prevPoints.current !== null &&
            user.points > prevPoints.current &&
            !showAlert
        ) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 4000);
            return () => clearTimeout(timer);
        }

        prevPoints.current = user.points;
    }, [user?.points, showAlert]);

    /* ---------------- Setup Status (Banner) ---------------- */
    const { data: verification } = useSWR(
        `/api/landlord/${landlordId}/profileStatus`,
        fetcher,
        { dedupingInterval: 60_000, revalidateOnFocus: false }
    );

    const { data: wallet } = useSWR(
        `/api/landlord/payout/${landlordId}`,
        fetcher,
        { dedupingInterval: 60_000, revalidateOnFocus: false }
    );

    const verificationStatus = verification?.status ?? "incomplete";


    const payoutStatus = wallet ? "completed" : "pending";


    /* ---------------- Warm subscription cache ---------------- */
    useSWR(`/api/landlord/subscription/active/${landlordId}`, fetcher, {
        dedupingInterval: 60_000,
        revalidateOnFocus: false,
    });

    /* ---------------- Delay heavy chart ---------------- */
    const [showRevenueChart, setShowRevenueChart] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setShowRevenueChart(true), 800);
        return () => clearTimeout(timer);
    }, []);

    /* ---------------- Modal ---------------- */
    const [showNewModal, setShowNewModal] = useState(false);

    return (
        <div className="pb-24 md:pb-6">
            <div className="px-4 md:px-6 pt-4 md:pt-6 space-y-6">
                {showAlert && <PointsEarnedAlert points={user?.points} />}

                <HeaderContent
                    greeting={greeting}
                    displayName={displayName}
                    landlordId={landlordId}
                />

                {/* ✅ Setup Banner replaces LandlordProfileStatus */}
                <LandlordSetupBanner
                    verificationStatus={verificationStatus}
                    payoutStatus={payoutStatus}
                    landlordId={landlordId}
                />

                <div className="flex justify-center">
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

                {/* Desktop */}
                <div className="hidden md:block space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Suspense fallback={<CardSkeleton />}>
                                <PaymentSummaryCard landlord_id={landlordId} />
                            </Suspense>
                        </div>

                        <Suspense fallback={<CardSkeleton />}>
                            <TodayCalendar landlordId={landlordId} />
                        </Suspense>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Suspense fallback={<CardSkeleton />}>
                            <div
                                role="button"
                                onClick={() =>
                                    router.push("/pages/landlord/maintenance-request")
                                }
                                className="cursor-pointer transition hover:scale-[1.02] active:scale-95"
                            >
                                <PendingMaintenanceDonut landlordId={landlordId} />
                            </div>
                        </Suspense>

                        <Suspense fallback={<CardSkeleton />}>
                            <LeaseOccupancyCard landlord_id={landlordId} />
                        </Suspense>

                        <Suspense fallback={<CardSkeleton />}>
                            <EndingLeaseCard landlord_id={landlordId} />
                        </Suspense>
                    </div>

                    {showRevenueChart && (
                        <Suspense fallback={<CardSkeleton />}>
                            <RevenuePerformanceChart landlord_id={landlordId} />
                        </Suspense>
                    )}
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                    <Suspense fallback={null}>
                        <MobileLandlordDashboard landlordId={landlordId} />
                    </Suspense>
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
