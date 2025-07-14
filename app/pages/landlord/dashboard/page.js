"use client";
import { useEffect, useState } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";

export default function LandlordDashboard() {
  const { user, admin, loading,fetchSession } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
      if (!user && !admin) {
        fetchSession();
      }
    }, [user, admin]);

  // useEffect(() => {
  //   setIsMounted(true);
  // }, []);


  return (
    <LandlordLayout>
      <div>
        <LandlordPropertyChart />
      </div>
    </LandlordLayout>
  );
}
