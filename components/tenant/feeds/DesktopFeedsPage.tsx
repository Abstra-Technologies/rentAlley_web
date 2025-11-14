"use client";

import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";

export default function DesktopFeedsPage({ user }) {
  return (
    <div className="hidden lg:block px-6 py-6">

      {/* PAYABLES */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <TenantPayables tenant_id={user?.tenant_id} />
      </div>

      {/* ANNOUNCEMENT + MAINTENANCE GRID */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="grid grid-cols-3 gap-4 p-4">
          <div className="col-span-2">
            <AnnouncementFeeds tenant_id={user?.tenant_id} />
          </div>
          <div className="col-span-1">
            <TenantMaintenanceWidget tenant_id={user?.tenant_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
