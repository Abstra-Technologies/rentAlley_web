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
import TenantActivity from "../widgets/TenantActivity";
import ProspectiveTenantsWidget from "../widgets/leads";
import LeaseWidget from "../analytics/leaseCountWidget";
import UpcomingVisitsWidget from "../properties/propertyVisit";
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
            .then((res) => setHeaderImage(res.data.resources?.[0]?.secure_url || null))
            .catch(() => setHeaderImage(null));
    }, []);

    const displayName =
        user?.firstName || user?.companyName || user?.email || "Landlord";

    return (
        <div
            className="
            min-h-screen
            bg-gradient-to-br from-blue-50 via-white to-emerald-50
            px-3 py-3 sm:px-4 lg:px-6 xl:px-8
            overflow-x-hidden
        "
        >
            {/* POINTS ALERT */}
            {/* {showAlert && <PointsEarnedAlert points={user?.points} />} */}

            {/* HEADER */}
            <HeaderContent
                greeting={greeting}
                displayName={displayName}
                landlordId={user?.landlord_id}
            />

            {/* PROFILE STATUS */}
            <div className="mb-3 lg:mb-4">
                <LandlordProfileStatus landlord_id={user?.landlord_id} />
            </div>

            {/* QUICK ACTIONS */}
            <div className="mb-4">
                <QuickActions
                    onAddProperty={() =>
                        router.push("/pages/landlord/property-listing/create-property")
                    }
                    onInviteTenant={() => router.push("/pages/landlord/invite-tenant")}
                    onAnnouncement={() =>
                        router.push("/pages/landlord/announcement/create-announcement")
                    }
                    onWorkOrder={() => setShowNewModal(true)}
                    onIncome={() => router.push("/pages/landlord/income")}
                />
            </div>

            {/* ===== DESKTOP SECTION ===== */}
            <div className="hidden sm:block w-full overflow-x-hidden space-y-4 lg:space-y-5">

                {/* TOP ANALYTICS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 w-full">

                    <div className="lg:col-span-2 w-full">
                        <PaymentSummaryCard landlord_id={user?.landlord_id} />
                    </div>

                    <div className="w-full">
                        <TodayCalendar landlordId={user?.landlord_id} />
                    </div>
                </div>

                {/* PROPERTY + TENANT ACTIVITY GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 w-full">

                    {/* PROPERTIES QUICK VIEW */}
                    <div
                        className="
                        relative bg-white rounded-lg shadow-sm p-3 lg:p-4 cursor-pointer w-full
                        transition hover:shadow-md hover:-translate-y-1 hover:bg-gray-50
                    "
                        onClick={() => router.push(`/pages/landlord/properties`)}
                    >
                        <LandlordPropertyMarquee landlordId={user?.landlord_id} />
                    </div>

                    {/* MAINTENANCE DONUT */}
                    <div
                        className="
                        bg-white rounded-lg shadow-sm p-3 lg:p-4 cursor-pointer
                        transition hover:shadow-md hover:-translate-y-1 hover:bg-gray-50
                    "
                        onClick={() => router.push(`/pages/landlord/tenant-activity`)}
                    >
                        <PendingMaintenanceDonut landlordId={user?.landlord_id} />
                    </div>

                    {/* RECENT PAYMENTS */}
                    <div
                        className="
                        bg-white rounded-lg shadow-sm p-3 lg:p-4 cursor-pointer
                        transition hover:shadow-md hover:-translate-y-1 hover:bg-gray-50
                    "
                        onClick={() => router.push(`/pages/landlord/payment-history`)}
                    >
                        <h2 className="text-xs lg:text-sm font-semibold text-gray-700 mb-2">
                            Recent Payments
                        </h2>

                        <PaymentList landlord_id={user?.landlord_id} />
                    </div>
                </div>

                {/* REVENUE PERFORMANCE */}
                <div className="bg-white rounded-lg shadow-sm p-3 lg:p-4">
                    <RevenuePerformanceChart landlord_id={user?.landlord_id} />
                </div>
            </div>

            {/* ===== MOBILE SECTION ===== */}
            <div className="block sm:hidden">
                <MobileLandlordAnalytics user={user} />
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
    );
}
