"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
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

// Dynamic Import
const RevenuePerformanceChart = dynamic(
    () => import("../analytics/revenuePerformance"),
    { ssr: false }
);

const LandlordMainDashboard = () => {
    const router = useRouter();
    const { user, fetchSession, loading } = useAuthStore();

    const [showAlert, setShowAlert] = useState(false);
    const prevPointsRef = useRef<number | null>(null);
    const [headerImage, setHeaderImage] = useState<string | null>(null);
    const [greeting, setGreeting] = useState("");
    const [showNewModal, setShowNewModal] = useState(false);

    // Greeting
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    // Points Earned Alert
    useEffect(() => {
        if (!loading && user?.points != null) {
            const prevPoints = prevPointsRef.current;
            if (prevPoints !== null && user.points > prevPoints) {
                setShowAlert(true);
                const timer = setTimeout(() => setShowAlert(false), 4000);
                return () => clearTimeout(timer);
            }
            prevPointsRef.current = user.points;
        }
    }, [user?.points, loading]);

    // Fetch Header Image
    useEffect(() => {
        const fetchHeader = async () => {
            try {
                const folder = `upkyp/headers/landlord`;
                const res = await axios.get(`/api/systemadmin/cms/imagesList?folder=${folder}`);
                const imgs = res.data.resources;
                setHeaderImage(imgs?.[0]?.secure_url || null);
            } catch {
                setHeaderImage(null);
            }
        };
        fetchHeader();
    }, []);

    const displayName =
        user?.firstName || user?.companyName || user?.email || "Landlord";

    return (
        <div
            className="
        min-h-screen
        bg-gradient-to-br from-blue-50 via-white to-emerald-50
        px-4 py-4 sm:px-6 lg:px-10
        overflow-x-hidden
      "
        >
            {/* POINTS ALERT */}
            {/*{showAlert && <PointsEarnedAlert points={user?.points} />}*/}

            {/* HEADER */}
            <HeaderContent
                greeting={greeting}
                displayName={displayName}
                landlordId={user?.landlord_id}
            />

            {/* PROFILE STATUS */}
            <div className="mb-4">
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
            <div className="hidden sm:block w-full overflow-x-hidden">
                {/* TOP ANALYTICS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-6">
                    {/* Payment Summary */}
                    <div className="lg:col-span-2 w-full">
                        <PaymentSummaryCard landlord_id={user?.landlord_id} />
                    </div>

                    {/* Maintenance Donut */}
                    <div className="w-full">
                        <TodayCalendar landlordId={user?.landlord_id} />
                    </div>
                </div>

                {/* PROPERTY + TENANT ACTIVITY GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-6">

                    {/* PROPERTY CARD */}
                    <div
                        onClick={() => router.push(`/pages/landlord/properties`)}
                        className="
            relative bg-white rounded-xl shadow-sm p-4 cursor-pointer w-full overflow-hidden
            transition-all duration-300
            hover:shadow-lg hover:-translate-y-1 hover:bg-gray-50
        "
                    >
                        <LandlordPropertyMarquee landlordId={user?.landlord_id} />

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition pointer-events-none">
            <span className="bg-white/90 shadow px-3 py-1 rounded-full text-xs font-medium">
                View Properties →
            </span>
                        </div>
                    </div>

                    {/* MAINTENANCE DONUT */}
                    <div
                        className="
            w-full bg-white rounded-xl shadow-sm p-4 cursor-pointer
            transition-all duration-300
            hover:shadow-lg hover:-translate-y-1 hover:bg-gray-50
        "
                        onClick={() => router.push(`/pages/landlord/tenant-activity`)}
                    >
                        <PendingMaintenanceDonut landlordId={user?.landlord_id} />
                    </div>

                    {/* PAYMENT LIST WITH HEADER */}
                    <div
                        className="
            w-full bg-white rounded-xl shadow-sm p-4 cursor-pointer
            transition-all duration-300
            hover:shadow-lg hover:-translate-y-1 hover:bg-gray-50
        "
                        onClick={() => router.push(`/pages/landlord/payment-history`)}
                    >
                        {/* 🔵 Header added here */}
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">
                            Recent Payments
                        </h2>

                        <PaymentList landlord_id={user?.landlord_id} />
                    </div>
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
                    onCreated={(newOrder) => {
                        setRequests((prev) => [newOrder, ...prev]);
                        setShowNewModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default LandlordMainDashboard;
