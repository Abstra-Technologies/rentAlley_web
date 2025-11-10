"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import ActiveRentConsolidatedCards from "@/components/tenant/analytics-insights/consolidated-analytics/ActiveRentalsCard";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import TenantLeaseReminderBanner from "@/components/tenant/currentRent/TenantLeaseReminderBanner";
import LoadingScreen from "@/components/loadingScreen";
import { BellIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function TenantFeedsPage() {
  const { user, fetchSession, loading } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);


  if (loading) {
    return (
        <LoadingScreen message="Just a moment, getting your feeds ready..." />
    );
  }

    return (
        <>
            <div className="flex min-h-screen bg-gray-50">
                <TenantOutsidePortalNav />
                <div className="page-content-wrapper">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-md">
                                    <BellIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">UpFeeds</h1>
                                    <p className="text-sm text-gray-600">
                                        Stay updated with the latest news about your rentals
                                    </p>
                                </div>
                            </div>

                            {/* Quick Status Badge */}
                            <div className="hidden md:flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                                <SparklesIcon className="w-4 h-4" />
                                <span>All Updates</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8">
                        {/* Payables Section */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 sm:p-6">
                            <TenantPayables tenant_id={user?.tenant_id} />
                        </div>

                        {/* Announcements Feed */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 sm:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Announcements - Larger width (2/3) */}
                                <div className="lg:col-span-2">
                                    <AnnouncementFeeds tenant_id={user?.tenant_id} />
                                </div>

                                {/* Maintenance Widget - Smaller width (1/3) */}
                                <div className="lg:col-span-1">
                                    <TenantMaintenanceWidget tenant_id={user?.tenant_id} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
</>
);

}
