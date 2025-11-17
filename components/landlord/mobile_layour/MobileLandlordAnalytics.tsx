"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
    Home,
    DollarSign,
    Users,
    TrendingUp,
    ChevronRight,
} from "lucide-react";
import PaymentSummaryCard from "@/components/landlord/analytics/PaymentSummaryCard";
import TenantActivity from "@/components/landlord/widgets/TenantActivity";
import ProspectiveTenantsWidget from "@/components/landlord/widgets/leads";
import UpcomingVisitsWidget from "@/components/landlord/properties/propertyVisit";
import SearchLeaseBar from "@/components/landlord/activeLease/SearchLeaseBar";
import LandlordSubscriptionStatus from "@/components/landlord/profile/LandlordSubscriptionStatus";
import LandlordCreditsSummary from "@/components/landlord/widgets/LandlordCreditsSummary";
import LandlordPropertyMarquee from "@/components/landlord/main_dashboard/LandlordPropertyQuickView";

const RevenuePerformanceChart = dynamic(
    () => import("@/components/landlord/analytics/revenuePerformance"),
    { ssr: false }
);

export default function MobileLandlordAnalytics({ user }) {
    const [activeTab, setActiveTab] = useState("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: Home },
        { id: "finance", label: "Finance", icon: DollarSign },
        { id: "activity", label: "Activity", icon: Users },
        { id: "upcoming", label: "Upcoming", icon: TrendingUp },
    ];

    return (
        <div className="sm:hidden">
            {/* Tabs */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex overflow-x-auto scrollbar-none px-3 py-2 space-x-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? "bg-gradient-to-r from-blue-100 to-emerald-100 text-blue-700 shadow"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="p-4 space-y-5">
                {/* Overview */}
                {activeTab === "overview" && (
                    <>
                    
                        <div className="mt-3">
                            <LandlordPropertyMarquee landlordId={user?.landlord_id} />
                        </div>

                        {/* Core Overview */}
                        {/*<PaymentSummaryCard landlord_id={user?.landlord_id} />*/}
                        {/*<TenantActivity landlord_id={user?.landlord_id} />*/}
                    </>
                )}

                {/* Finance */}
                {activeTab === "finance" && (
                    <>
                        <PaymentSummaryCard landlord_id={user?.landlord_id} />
                        <div className="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Revenue Trends
                                </h3>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <RevenuePerformanceChart landlordId={user?.landlord_id} />
                        </div>
                    </>
                )}

                {/* Activity */}
                {activeTab === "activity" && (
                    <ProspectiveTenantsWidget landlordId={user?.landlord_id} />
                )}

                {/* Upcoming */}
                {activeTab === "upcoming" && (
                    <UpcomingVisitsWidget landlordId={user?.landlord_id} />
                )}
            </div>
        </div>
    );
}
