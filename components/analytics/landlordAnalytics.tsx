"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import PointsEarnedAlert from "../Commons/alertPoints";
import LandlordProfileStatus from "../landlord/profile/LandlordProfileStatus";
import SendTenantInviteModal from "@/components/landlord/properties/sendInvite";
import SearchLeaseBar from "@/components/landlord/activeLease/SearchLeaseBar";
import LandlordSubscriptionStatus from "@/components/landlord/profile/LandlordSubscriptionStatus";
import LandlordCreditsSummary from "@/components/landlord/widgets/LandlordCreditsSummary";
import LandlordPropertyMarquee from "@/components/landlord/properties/LandlordPropertyQuickView";
import PaymentSummaryCard from "../landlord/analytics/PaymentSummaryCard";
import TenantActivity from "../landlord/widgets/TenantActivity";
import ProspectiveTenantsWidget from "../landlord/widgets/leads";
import LeaseWidget from "../landlord/analytics/leaseCountWidget";
import TaskWidget from "../landlord/widgets/taskToDo";
import { TrendingUp, Users, Home, DollarSign } from "lucide-react";

// Dynamic imports
const RevenuePerformanceChart = dynamic(
    () => import("../landlord/analytics/revenuePerformance"),
    { ssr: false }
);
const UpcomingVisitsWidget = dynamic(
    () => import("../landlord/properties/propertyVisit"),
    { ssr: false }
);

// ✅ Mobile Layout
import MobileLandlordAnalytics from "@/components/landlord/mobile_layour/MobileLandlordAnalytics";

const LandlordPropertyChart = () => {
    const { user, fetchSession, loading } = useAuthStore();
    const router = useRouter();
    const [occupancyRate, setOccupancyRate] = useState(0);
    const [totalTenants, setTotalTenants] = useState(0);
    const [totalProperties, setTotalProperties] = useState(0);
    const [totalReceivables, setTotalReceivables] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const prevPointsRef = useRef<number | null>(null);
    const [greeting, setGreeting] = useState("");

    // Greeting logic
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

    // Alert for points earned
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

    // Fetch analytics
    useEffect(() => {
        if (!user?.landlord_id) return;
        const landlord_id = user.landlord_id;

        fetch(`/api/analytics/landlord/getActiveListings?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => setTotalProperties(data.totalActiveListings || 0));

        fetch(`/api/analytics/landlord/occupancyRateProperty?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                const raw = data?.occupancyRate ?? data?.occupancy_rate ?? 0;
                let num =
                    typeof raw === "string"
                        ? parseFloat(raw.replace("%", ""))
                        : Number(raw);
                if (num > 0 && num <= 1) num *= 100;
                setOccupancyRate(Number.isFinite(num) ? num : 0);
            })
            .catch(() => setOccupancyRate(0));

        fetch(`/api/analytics/landlord/getTotalTenants?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => setTotalTenants(data?.total_tenants || 0));
    }, [user?.landlord_id]);

    return (
        <div className="bg-gray-50 min-h-screen px-2 sm:px-6">
            {showAlert && <PointsEarnedAlert points={user?.points} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="text-left">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent">
                        {greeting},{" "}
                        {user?.firstName
                            ? user.firstName
                            : user?.companyName
                                ? user.companyName
                                : user?.email}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
            <span className="hidden sm:inline">
              Simplifying property management, empowering landlords.
            </span>
                        <span className="sm:hidden">Welcome to your dashboard</span>
                    </p>
                </div>
                <div className="mt-2 sm:mt-0">
                    <SendTenantInviteModal landlord_id={user?.landlord_id} />
                </div>
            </div>

            {/* Profile Status */}
            <div className="mb-4">
                <LandlordProfileStatus landlord_id={user?.landlord_id} />
            </div>

            {/* 🔍 Search + Subscription + Credits (Desktop only) */}
            <div className="hidden sm:grid sm:grid-cols-3 sm:gap-6 sm:items-start mb-6">
                {/* Search Bar */}
                <div className="w-full sm:col-span-1 flex flex-col justify-center text-center">
                    <div className="relative w-full max-w-md mx-auto">
                        <SearchLeaseBar />
                    </div>
                </div>

                {/* Subscription */}
                <div className="w-full">
                    <LandlordSubscriptionStatus landlordId={user?.landlord_id} />
                </div>

                {/* Credits */}
                <div className="w-full">
                    <LandlordCreditsSummary landlordId={user?.landlord_id} />
                </div>
            </div>

            {/* 🖥️ Desktop Analytics */}
            <div className="hidden sm:block">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                        <p className="text-gray-500 text-sm">Total Properties</p>
                        <p className="text-2xl font-bold text-gray-800">{totalProperties}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-emerald-500">
                        <p className="text-gray-500 text-sm">Occupancy Rate</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {occupancyRate.toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-teal-500">
                        <p className="text-gray-500 text-sm">Total Tenants</p>
                        <p className="text-2xl font-bold text-gray-800">{totalTenants}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                        <p className="text-gray-500 text-sm">Total Receivables</p>
                        <p className="text-2xl font-bold text-gray-800">
                            ₱{totalReceivables.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                        <PaymentSummaryCard landlord_id={user?.landlord_id} />
                    </div>
                    <TaskWidget landlordId={user?.landlord_id} />
                </div>

                <LandlordPropertyMarquee landlordId={user?.landlord_id} />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {/* Revenue Performance (col-span-2) with View Revenue hover overlay */}
                    <div
                        onClick={() => router.push(`/pages/landlord/analytics/detailed/revenue`)}
                        className="relative bg-white rounded-xl shadow-sm p-5 cursor-pointer
               hover:shadow-md hover:bg-gray-50 transition group lg:col-span-2"
                    >
                        {/* Chart content always visible */}
                        <RevenuePerformanceChart landlordId={user?.landlord_id} />

                        {/* Hover label — does not block chart interaction */}
                        <div
                            className="absolute inset-0 flex items-center justify-center
                 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        >
      <span
          className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium
                   px-3 py-1 rounded-full shadow-md border border-gray-200"
      >
        View Revenue →
      </span>
                        </div>
                    </div>

                    {/* Tenant Activity (unchanged) */}
                    <TenantActivity landlord_id={user?.landlord_id} />
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    <UpcomingVisitsWidget landlordId={user?.landlord_id} />
                    <ProspectiveTenantsWidget landlordId={user?.landlord_id} />
                    <LeaseWidget landlord_id={user?.landlord_id} />
                </div>
            </div>

            {/* 📱 Mobile Layout (only visible on mobile) */}
            <div className="block sm:hidden">
                <MobileLandlordAnalytics user={user} />
            </div>
        </div>
    );
};

export default LandlordPropertyChart;
