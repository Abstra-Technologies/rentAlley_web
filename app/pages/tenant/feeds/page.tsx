"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import ActiveRentConsolidatedCards from "@/components/tenant/analytics-insights/consolidated-analytics/ActiveRentalsCard";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantLeaseReminderBanner from "@/components/tenant/currentRent/TenantLeaseReminderBanner";
import LoadingScreen from "@/components/loadingScreen";
import NameModal from "@/components/Commons/profile/accountSetupName";
import { BellIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function TenantFeedsPage() {
  const { user, fetchSession, loading } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (user && (!user.firstName?.trim() || !user.lastName?.trim())) {
      setIsModalOpen(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        <LoadingScreen message="Just a moment, getting your feeds ready..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav />

      <div className="flex-1 md:ml-64">
        <div className="w-full">
          {/* Page Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Setup Modal */}
            {user && (
              <NameModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={user?.user_id}
              />
            )}

            {/* Lease Reminder Banner */}
            <div className="mb-6 sm:mb-8">
              <TenantLeaseReminderBanner tenantId={user?.tenant_id} />
            </div>

            {/* Header Section */}
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2 mb-2">
                <BellIcon className="w-6 h-6 text-emerald-600" />
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  UpFeeds
                </h1>
              </div>
              <p className="text-gray-600 text-sm sm:text-base ml-8">
                Stay updated with announcements and property updates
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Feed Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Feed Header */}
                <div className="flex items-center gap-2 px-6 py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg">
                    <SparklesIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Latest Announcements
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Important updates from your properties
                    </p>
                  </div>
                </div>

                {/* Announcement Feed */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <AnnouncementFeeds tenant_id={user?.tenant_id} />
                </div>
              </div>

              {/* Sidebar Widgets */}
              <div className="lg:col-span-1 space-y-6">
                {/* Payables Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-5 sm:p-6">
                    <TenantPayables tenant_id={user?.tenant_id} />
                  </div>
                </div>

                {/* Active Rentals Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-5 sm:p-6">
                    <ActiveRentConsolidatedCards tenant_id={user?.tenant_id} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
