"use client";

import { useState, useEffect } from "react";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import TenantCalendar from "@/components/tenant/feeds/TenantCalendar";

export default function DesktopFeedsPage({ user }) {
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitialLoad(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    /* ===============================
       LOADING STATE
    =============================== */
    if (isInitialLoad) {
        return (
            <div className="hidden lg:block px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-full">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
                                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-1.5" />
                                    <div className="h-3 bg-gray-200 rounded w-56 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-64 animate-pulse" />
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-64 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    /* ===============================
       MAIN VIEW
    =============================== */
    return (
        <div className="hidden lg:block px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN — ANNOUNCEMENTS */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-full">
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                                <MegaphoneIcon className="w-5 h-5 text-white" />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Announcements
                                </h2>
                                <p className="text-xs text-gray-600">
                                    Latest updates from your landlord
                                </p>
                            </div>
                        </div>

                        <AnnouncementFeeds
                            tenant_id={user?.tenant_id}
                            maxItems={5}
                            showViewAll={true}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN — CALENDAR + PAYABLES + MAINTENANCE */}
                <div className="space-y-6">
                    {/* TENANT CALENDAR */}
                    {user?.tenant_id && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                            <TenantCalendar tenantId={user?.tenant_id} />
                        </div>
                    )}

                    {/* PAYABLES */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <TenantPayables tenant_id={user?.tenant_id} />
                    </div>

                    {/* MAINTENANCE */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                        <TenantMaintenanceWidget
                            tenant_id={user?.tenant_id}
                            maxItems={3}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
