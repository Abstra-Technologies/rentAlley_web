"use client";

import { Suspense } from "react";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import {
  MegaphoneIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

// Skeleton Loading Components
const PayablesSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
    <div className="h-10 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

const AnnouncementSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    ))}
  </div>
);

const MaintenanceSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      </div>
    ))}
  </div>
);

export default function MobileFeedsPage({ user }) {
  return (
    <div className="block lg:hidden w-full min-h-screen">
      {/* Safe area for top navbar */}
      <div className="h-14"></div>

      {/* Main content container with proper padding */}
      <div className="w-full px-3 sm:px-4 py-4 pb-24 safe-bottom">
        <div className="w-full max-w-[480px] mx-auto space-y-4">
          {/* PAYABLES */}
          <Suspense fallback={<PayablesSkeleton />}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <TenantPayables tenant_id={user?.tenant_id} />
            </div>
          </Suspense>

          {/* ANNOUNCEMENTS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <MegaphoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  Announcements
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                  Latest updates
                </p>
              </div>
            </div>

            <Suspense fallback={<AnnouncementSkeleton />}>
              <AnnouncementFeeds
                tenant_id={user?.tenant_id}
                maxItems={3}
                showViewAll={true}
              />
            </Suspense>
          </div>

          {/* MAINTENANCE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <WrenchScrewdriverIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  Maintenance
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                  Service requests
                </p>
              </div>
            </div>

            <Suspense fallback={<MaintenanceSkeleton />}>
              <TenantMaintenanceWidget
                tenant_id={user?.tenant_id}
                maxItems={3}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
