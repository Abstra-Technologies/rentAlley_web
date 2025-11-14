"use client";

import { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

import MobileFeedsPage from "@/components/tenant/feeds/MobileFeedsPage";
import DesktopFeedsPage from "@/components/tenant/feeds/DesktopFeedsPage";

export default function TenantFeedsPage() {
  const { user, fetchSession, loading } = useAuthStore();

  useEffect(() => {
    fetchSession();
  }, []);

  if (loading) {
    return (
      <LoadingScreen message="Just a moment, getting your feeds ready..." />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">

      {/* MOBILE — default view */}
      <div className="block lg:hidden w-full">
        <MobileFeedsPage user={user} />
      </div>

      {/* DESKTOP — only show on large screens */}
      <div className="hidden lg:block w-full max-w-7xl mx-auto px-6 py-6">
        <DesktopFeedsPage user={user} />
      </div>

    </div>
  );
}
