"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import LandlordMainDashboard from "@/components/landlord/main_dashboard/main_dashboard";

export default function LandlordDashboard() {
  const { user, loading, fetchSession } = useAuthStore();
  useEffect(() => { if (!user) fetchSession(); }, [user]);

  return (
      <LandlordLayout>
        <div className="px-2 sm:px-0">
          <LandlordMainDashboard />
        </div>
      </LandlordLayout>
  );
}
