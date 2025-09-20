"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";
import PointsEarnedAlert from "../../../../components/Commons/alertPoints";
import LandlordProfileStatus from "../../../../components/landlord/profile/LandlordProfileStatus"
import SendTenantInviteModal from "../../../../components/landlord/properties/sendInvite"


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

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Greeting */}
                    <div className="text-center sm:text-left">
                        <h2 className="gradient-header text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold leading-snug">
                            {greeting}, {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="font-normal text-xs sm:text-sm md:text-base lg:text-lg text-gray-600">
                            Simplifying property management, empowering landlords.
                        </p>
                    </div>

                    {/* Invite Tenant Button */}
                    <SendTenantInviteModal landlord_id={user?.landlord_id} />
                </div>


                <div className="mt-4">
                    <LandlordProfileStatus landlord_id={user?.landlord_id} />
                </div>

                <LandlordPropertyChart />
            </div>
        </LandlordLayout>
    );
}
