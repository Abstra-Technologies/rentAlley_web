"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import PointsEarnedAlert from "@/components/Commons/alertPoints";
import LandlordProfileStatus from "../profile/LandlordProfileStatus";
import SendTenantInviteModal from "@/components/landlord/properties/sendInvite";
import SearchLeaseBar from "@/components/landlord/activeLease/SearchLeaseBar";
import LandlordSubscriptionStatus from "@/components/landlord/profile/LandlordSubscriptionStatus";
import LandlordCreditsSummary from "@/components/landlord/widgets/LandlordCreditsSummary";
import LandlordPropertyMarquee from "@/components/landlord/main_dashboard/LandlordPropertyQuickView";
import PaymentSummaryCard from "../analytics/PaymentSummaryCard";
import TenantActivity from "../widgets/TenantActivity";
import ProspectiveTenantsWidget from "../widgets/leads";
import LeaseWidget from "../analytics/leaseCountWidget";
import TaskWidget from "../widgets/taskToDo";
// Dynamic imports
const RevenuePerformanceChart = dynamic(
    () => import("../analytics/revenuePerformance"),
    { ssr: false }
);
const UpcomingVisitsWidget = dynamic(
    () => import("../properties/propertyVisit"),
    { ssr: false }
);
import MobileLandlordAnalytics from "@/components/landlord/mobile_layour/MobileLandlordAnalytics";
import axios from "axios";
import HeaderContent from "./headerContent";
import QuickActions from "./QuickActions";
import Clock from "./Clock";

const LandlordMainDashboard = () => {
    const { user, fetchSession, loading } = useAuthStore();
    const router = useRouter();
    const [occupancyRate, setOccupancyRate] = useState(0);
    const [totalTenants, setTotalTenants] = useState(0);
    const [totalProperties, setTotalProperties] = useState(0);
    const [totalReceivables, setTotalReceivables] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const prevPointsRef = useRef<number | null>(null);
    const [greeting, setGreeting] = useState("");
    const [headerImage, setHeaderImage] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchHeader = async () => {
            try {
                const folder = `upkyp/headers/landlord`;
                const res = await axios.get(`/api/systemadmin/cms/imagesList?folder=${folder}`);
                const imgs = res.data.resources;

                if (imgs && imgs.length > 0) {
                    setHeaderImage(imgs[0].secure_url);
                } else {
                    setHeaderImage(null);
                }
            } catch (err) {
                console.error("Failed to fetch landlord header:", err);
                setHeaderImage(null);
            }
        };
        fetchHeader();
    }, []);
    const displayName =
        user?.firstName || user?.companyName || user?.email || "Landlord";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-10">
            {showAlert && <PointsEarnedAlert points={user?.points} />}

               {/* Compact Header */}
<div className="w-full mb-3">
  <div className="max-w-9xl mx-auto px-3 sm:px-4 lg:px-5">
    <div className="relative w-full rounded-lg overflow-hidden shadow-sm border border-gray-200">

      {headerImage ? (
        <div
          className="
            relative 
            h-24 sm:h-28 lg:h-32
            bg-center bg-cover
            flex items-center
          "
          style={{ backgroundImage: `url(${headerImage})` }}
        >
          {/* Light overlay */}
          <div className="absolute inset-0 bg-black/35" />

          <div className="relative z-10 w-full flex justify-between items-center px-4 sm:px-6">
            {/* Left: Greeting */}
            <HeaderContent
              greeting={greeting}
              displayName={displayName}
              landlordId={user?.landlord_id}
            />
          </div>
        </div>
      ) : (
        <div
          className="
            flex flex-row 
            items-center justify-between
            p-3 sm:p-4
            rounded-lg 
            bg-gradient-to-r from-blue-700 to-emerald-600 
            text-white
          "
        >
          {/* Left: Greeting */}
          <HeaderContent
            greeting={greeting}
            displayName={
              user?.firstName ?? user?.companyName ?? user?.email
            }
            landlordId={user?.landlord_id}
          />
        </div>
      )}

    </div>
  </div>
</div>

            {/* Profile Status */}
            <div className="mb-4">
                <LandlordProfileStatus landlord_id={user?.landlord_id} />
            </div>

            <div className="mb-2">
                <QuickActions
                onAddProperty={() => router.push("/pages/landlord/property-listing/create-property")}
                onInviteTenant={() => router.push("/pages/landlord/invite-tenant")}
                onAnnouncement={() => router.push("/pages/landlord/announcement/create-announcement")}
                onWithdraw={() => router.push("/pages/landlord/announcement/create-announcement")}
                />
            </div>

            {/* 🔍 Search + Subscription + Credits (Desktop only) */}
            {/* <div className="hidden sm:grid sm:grid-cols-3 sm:gap-6 sm:items-start mb-6">
                <div className="w-full sm:col-span-1 flex flex-col justify-center text-center">
                    <div className="relative w-full max-w-md mx-auto">
                        <SearchLeaseBar />
                    </div>
                </div>
                <div className="w-full">
                    <LandlordSubscriptionStatus landlordId={user?.landlord_id} />
                </div>
                <div className="w-full">
                    <LandlordCreditsSummary landlordId={user?.landlord_id} />
                </div>
            </div> */}

            {/* 🖥️ Desktop Widgets */}
            <div className="hidden sm:block overflow-x-hidden">
                
                {/* Analytics Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* Payment Summary */}
  <div className="lg:col-span-2">
    <PaymentSummaryCard landlord_id={user?.landlord_id} />
  </div>

  {/* Task Widget */}
  <div>
    <TaskWidget landlordId={user?.landlord_id} />
  </div>

</div>



                {/* 🏠 Property Marquee Section — FIXED, NO STRETCH */}
                <div className="mb-6">
                    <div className="relative rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden h-[220px] sm:h-[260px]">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LandlordPropertyMarquee landlordId={user?.landlord_id} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div
                        onClick={() => router.push(`/pages/landlord/analytics/detailed/revenue`)}
                        className="relative bg-white rounded-xl shadow-sm p-5 cursor-pointer
          hover:shadow-md hover:bg-gray-50 transition group lg:col-span-2"
                    >
                        <RevenuePerformanceChart landlordId={user?.landlord_id} />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow-md border border-gray-200">
              View Revenue →
            </span>
                        </div>
                    </div>

                    <TenantActivity landlord_id={user?.landlord_id} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    <UpcomingVisitsWidget landlordId={user?.landlord_id} />
                    <ProspectiveTenantsWidget landlordId={user?.landlord_id} />
                    <LeaseWidget landlord_id={user?.landlord_id} />
                </div>
            </div>

            {/* 📱 Mobile Layout (only visible on mobile) */}
            <div className="block sm:hidden overflow-x-hidden">
                <MobileLandlordAnalytics user={user} />
            </div>
        </div>
    );

};

export default LandlordMainDashboard;
