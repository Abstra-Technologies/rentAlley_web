"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";
import PointsEarnedAlert from "../../../../components/Commons/alertPoints";

export default function LandlordDashboard() {

  const { user, admin, loading,fetchSession } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [pointMessage, setPointMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const prevPointsRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
      if (!user && !admin) {
        fetchSession();
      }
    }, [user, admin]);

    useEffect(() => {
        if (!loading && user?.points != null) {
            const prevPoints = prevPointsRef.current;

            if (prevPoints !== null && user.points > prevPoints) {
                setShowAlert(true);

                const timer = setTimeout(() => {
                    setShowAlert(false);
                }, 5000);

                return () => clearTimeout(timer);
            }
            // update ref after checking
            prevPointsRef.current = user.points;
        }
    }, [user?.points, loading]);


  return (
    <LandlordLayout>
        {showAlert && <PointsEarnedAlert points={user.points} />}
        <div>
        <LandlordPropertyChart />
      </div>
    </LandlordLayout>
  );
}
