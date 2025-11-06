"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import ActiveRentConsolidatedCards from "@/components/tenant/analytics-insights/consolidated-analytics/ActiveRentalsCard";
import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        <LoadingScreen message="Just a moment, getting your feeds ready..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav />

      <div className="page-content-wrapper">
        {/* Top Navigation Bar */}
        <div className="page-header">
          <div className="page-header-container">
            <div className="page-header-inner">
              <div className="page-header-title-section">
                <div className="page-header-icon">
                  <BellIcon />
                </div>
                <div>
                  <h1 className="page-header-title">UpFeeds</h1>
                  <p className="page-header-subtitle">
                    Stay updated with announcements
                  </p>
                </div>
              </div>

              {/* Quick Status Badge */}
              <div className="hidden md:flex status-badge status-badge-success">
                <SparklesIcon className="w-4 h-4" />
                <span>All Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="page-main-content">

          {/* Lease Reminder Banner */}
          <div className="mb-6 sm:mb-8">
            <TenantLeaseReminderBanner tenantId={user?.tenant_id} />
          </div>

          {/* Quick Stats Cards - Horizontal Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Payables Widget */}
            <div className="card">
              <div className="card-padding">
                <TenantPayables tenant_id={user?.tenant_id} />
              </div>
            </div>

            {/* Active Rentals Widget */}
            <div className="card">
              <div className="card-padding">
                <ActiveRentConsolidatedCards tenant_id={user?.tenant_id} />
              </div>
            </div>
          </div>

          {/* Announcement Feed - Now with integrated header */}
          <div className="card-elevated">
            <AnnouncementFeeds tenant_id={user?.tenant_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
