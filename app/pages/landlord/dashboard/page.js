"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";
import PointsEarnedAlert from "../../../../components/Commons/alertPoints";
import LandlordProfileStatus from "../../../../components/landlord/profile/LandlordProfileStatus"


export default function LandlordDashboard() {

  const { user, admin, loading,fetchSession } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [pointMessage, setPointMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const prevPointsRef = useRef(null);
  const router = useRouter();
  const [greeting, setGreeting] = useState("");

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good evening";
    }

  useEffect(() => {
      if (!user && !admin) {
        fetchSession();
      }
    }, [user, admin]);

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

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

                <h2 className="gradient-header">
                    {greeting}, {user?.firstName + user?.lastName}
                    <p className='font-normal text-sm'>Simplifying property management, empowering landlords.</p>
                </h2>
                <div className="mt-4">
                    <LandlordProfileStatus landlord_id={user?.landlord_id} />
                </div>

                <LandlordPropertyChart />
            </div>
        </LandlordLayout>
    );
}
