"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import LandlordPropertyChart from "@/components/analytics/landlordAnalytics";

export default function LandlordDashboard() {
  const { user, loading, fetchSession } = useAuthStore();
  useEffect(() => { if (!user) fetchSession(); }, [user]);

  return (
      <LandlordLayout>
        <div className="px-2 sm:px-0">
          <LandlordPropertyChart />
        </div>
      </LandlordLayout>
  );
}
