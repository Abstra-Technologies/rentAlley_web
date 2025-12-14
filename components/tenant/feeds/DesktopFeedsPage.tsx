"use client";

import { useState, useEffect } from "react";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import { MegaphoneIcon } from "@heroicons/react/24/outline";

export default function DesktopFeedsPage({ user }) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoad) {
    return (
      <div className="hidden lg:block px-6 lg:px-8 py-6">
        {/* GRID: 2 Columns */}
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

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
                    </div>

                    {/* Image Placeholder */}
                    {i === 1 && (
                      <div className="h-48 bg-gray-200 rounded-lg animate-pulse mt-3" />
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                      <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                </div>

                {/* Amount */}
                <div className="h-10 bg-gray-200 rounded w-48 animate-pulse mb-4" />

                {/* Stats */}
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
              </div>

              {/* Request Cards */}
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    {/* Image + Content */}
                    <div className="flex gap-3 mb-2">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-full animate-pulse mb-1" />
                        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <h2 className="text-lg font-bold text-gray-900">
                  Announcements
                </h2>
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
            <TenantMaintenanceWidget tenant_id={user?.tenant_id} maxItems={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
