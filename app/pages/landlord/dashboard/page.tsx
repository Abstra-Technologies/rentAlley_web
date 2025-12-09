"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordMainDashboard from "@/components/landlord/main_dashboard/main_dashboard";

export default function LandlordDashboard() {
  const { user, fetchSession } = useAuthStore();

  // Fetch user session if not already loaded
  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

  return <LandlordMainDashboard />;
}
