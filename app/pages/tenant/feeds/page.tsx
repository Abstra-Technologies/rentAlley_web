"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import LoadingScreen from "@/components/loadingScreen";

import { BellIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function TenantFeedsPage() {
  const { user, fetchSession, loading } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  if (loading) {
    return (
      <LoadingScreen message="Just a moment, getting your feeds ready..." />
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">

        {/* MAIN PAGE WRAPPER */}
      <div className="w-full">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* ============================== */}
            {/* HEADER */}
            {/* ============================== */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                {/* Title + Icon */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-md">
                    <BellIcon className="icon-responsive text-white" />
                  </div>

                  <div>
                    <h1 className="text-responsive font-bold text-gray-900">
                      UpFeeds
                    </h1>
                    <p className="text-responsive text-gray-600">
                      Stay updated with the latest news about your rentals
                    </p>
                  </div>
                </div>

                {/* Badge */}
                <div className="hidden sm:flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full shadow-sm">
                  <SparklesIcon className="icon-responsive text-emerald-700" />
                  <span className="text-responsive font-semibold">
                    All Updates
                  </span>
                </div>

              </div>
            </div>

            {/* ============================== */}
            {/* PAYABLES SECTION */}
            {/* ============================== */}
            <div className="card-responsive bg-white border border-gray-200 shadow-sm rounded-2xl mb-6">
              <TenantPayables tenant_id={user?.tenant_id} />
            </div>

            {/* ============================== */}
            {/* FEEDS SECTION */}
            {/* ============================== */}
            <div className="card-responsive bg-white border border-gray-200 shadow-sm rounded-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ANNOUNCEMENTS */}
                <div className="lg:col-span-2">
                  <AnnouncementFeeds tenant_id={user?.tenant_id} />
                </div>

                {/* MAINTENANCE */}
                <div className="lg:col-span-1">
                  <TenantMaintenanceWidget tenant_id={user?.tenant_id} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
