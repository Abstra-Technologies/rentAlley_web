"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";
import PointsEarnedAlert from "../../../../components/Commons/alertPoints";
import LandlordProfileStatus from "../../../../components/landlord/profile/LandlordProfileStatus";
import SendTenantInviteModal from "../../../../components/landlord/properties/sendInvite";

export default function LandlordDashboard() {
  const { user, admin, loading, fetchSession } = useAuthStore();
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
    return "Good Evening";
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
      prevPointsRef.current = user.points;
    }
  }, [user?.points, loading]);

  return (
    <LandlordLayout>
      {showAlert && <PointsEarnedAlert points={user.points} />}

      {/* Mobile-optimized container with better padding */}
      <div className="px-2 sm:px-0">
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          {/* Greeting - Better mobile typography */}
          <div className="text-left">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent">
              {greeting}, {user?.firstName}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              <span className="hidden sm:inline">
                Simplifying property management, empowering landlords.
              </span>
              <span className="sm:hidden">Welcome to your dashboard</span>
            </p>
          </div>

          {/* Invite Button - Mobile Optimized */}
          <div className="mt-2 sm:mt-0">
            <SendTenantInviteModal landlord_id={user?.landlord_id} />
          </div>
        </div>

        {/* Profile Status */}
        <div className="mb-4">
          <LandlordProfileStatus landlord_id={user?.landlord_id} />
        </div>

        {/* Analytics Section - Mobile Responsive */}
        <div className="mobile-analytics-container">
          <LandlordPropertyChart />
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .mobile-analytics-container {
            margin-left: -0.5rem;
            margin-right: -0.5rem;
          }
        }
      `}</style>
    </LandlordLayout>
  );
}
