"use client";

import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import { MegaphoneIcon } from "@heroicons/react/24/outline";

export default function DesktopFeedsPage({ user }) {
    return (
        <div className="hidden lg:block px-6 lg:px-8 py-6">

            {/* GRID: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN — ANNOUNCEMENTS (2/3 width) */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-full">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                                <MegaphoneIcon className="w-5 h-5 text-white" />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
                                <p className="text-xs text-gray-600">
                                    Latest updates from your landlord
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <AnnouncementFeeds
                            tenant_id={user?.tenant_id}
                            maxItems={5}
                            showViewAll={true}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN — STACKED PAYABLES + MAINTENANCE */}
                <div className="space-y-6">

                    {/* PAYABLES CARD */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <TenantPayables tenant_id={user?.tenant_id} />
                    </div>

                    {/* MAINTENANCE REQUESTS CARD */}
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
