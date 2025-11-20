"use client";

import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function MobileFeedsPage({ user }) {
  const router = useRouter();

  return (
    <div className="block lg:hidden w-full px-4 py-4">
      <div className="w-full max-w-[480px] mx-auto space-y-4">
        {/* PAYABLES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TenantPayables tenant_id={user?.tenant_id} />
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/pages/tenant/my-unit")}
            className="flex-1 flex flex-col items-center justify-center py-3 px-2 bg-white border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-all hover:border-blue-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center mb-1.5">
              <HomeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              My Units
            </span>
          </button>

          <button
            onClick={() => router.push("/pages/find-rent")}
            className="flex-1 flex flex-col items-center justify-center py-3 px-2 bg-white border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-all hover:border-blue-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center mb-1.5">
              <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              Find Rent
            </span>
          </button>

          <button
            onClick={() => router.push("/pages/tenant/maintenance")}
            className="flex-1 flex flex-col items-center justify-center py-3 px-2 bg-white border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-all hover:border-blue-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center mb-1.5">
              <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              Maintenance
            </span>
          </button>

          <button
            onClick={() => router.push("/pages/tenant/announcements")}
            className="flex-1 flex flex-col items-center justify-center py-3 px-2 bg-white border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-all hover:border-blue-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center mb-1.5">
              <MegaphoneIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Updates</span>
          </button>
        </div>

        {/* ANNOUNCEMENTS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <MegaphoneIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Announcements
              </h2>
              <p className="text-xs text-gray-600">Latest updates</p>
            </div>
          </div>
          {/* Show 3 items max on mobile with "Show More" */}
          <AnnouncementFeeds
            tenant_id={user?.tenant_id}
            maxItems={3}
            showViewAll={true}
          />
        </div>

        {/* MAINTENANCE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          {/* Show 3 items max on mobile */}
          <TenantMaintenanceWidget tenant_id={user?.tenant_id} maxItems={3} />
        </div>

        {/* Bottom Spacer for Mobile Nav */}
        <div className="h-20" />
      </div>
    </div>
  );
}
