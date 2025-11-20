"use client";

import { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import MobileFeedsPage from "@/components/tenant/feeds/MobileFeedsPage";
import DesktopFeedsPage from "@/components/tenant/feeds/DesktopFeedsPage";

export default function TenantFeedsPage() {
  const { user, admin, fetchSession, loading } = useAuthStore();

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  if (loading) {
    return (
      <LoadingScreen message="Just a moment, getting your feeds ready..." />
    );
  }

  return (
    <>
      {/* MOBILE VIEW */}
      <MobileFeedsPage user={user} />

      {/* DESKTOP VIEW */}
      <DesktopFeedsPage user={user} />
    </>
  );
}
