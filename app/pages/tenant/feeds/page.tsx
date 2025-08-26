"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import ActiveRentConsolidatedCards from "@/components/tenant/analytics-insights/consolidated-analytics/ActiveRentalsCard";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";

export default function TenantFeedsPage() {
    const { user, fetchSession, loading } = useAuthStore();

    useEffect(() => {
        fetchSession();

    }, [fetchSession]);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <TenantOutsidePortalNav />

            <div className="flex-1 p-6">
                <h1 className="text-2xl font-bold mb-4">My Feeds</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Announcement Feed - Bigger Section */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <AnnouncementFeeds tenant_id={user?.tenant_id} />
                    </div>

                    {/* Sidebar Widgets */}
                    <div className="col-span-1 space-y-4">
                        <TenantPayables tenant_id={user?.tenant_id} />
                        <ActiveRentConsolidatedCards tenant_id={user?.tenant_id} />
                    </div>
                </div>
            </div>
        </div>

    );
}
