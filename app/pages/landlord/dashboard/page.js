"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";
import PointsEarnedAlert from "../../../../components/Commons/alertPoints";
import LandlordProfileStatus from "../../../../components/landlord/profile/LandlordProfileStatus";
import SendTenantInviteModal from "../../../../components/landlord/properties/sendInvite";
import SearchLeaseBar from "../../../../components/landlord/activeLease/SearchLeaseBar";
export default function LandlordDashboard() {
  const { user, admin, loading, fetchSession } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [pointMessage, setPointMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const prevPointsRef = useRef(null);
  const router = useRouter();
  const [greeting, setGreeting] = useState("");
  const [totalCredits, setTotalCredits] = useState(0);

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
              {greeting},{" "}
              {user?.firstName
                  ? user.firstName
                  : user?.companyName
                      ? user.companyName
                      : user?.email}
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

        {/* ===== Search Bar + Credits Card Row ===== */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          {/* 🔍 Search Bar (unchanged, with description below) */}
          <div className="flex-1 flex flex-col items-center align-center justify-center text-center">
            {/* 🔍 Search bar */}
            <div className="relative w-full mx-auto">
              <SearchLeaseBar />
            </div>
          </div>



          {/* 💰 Total Credits Summary Card */}
          <div className="w-full sm:w-[280px] lg:w-[320px] flex-shrink-0">
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl shadow-md p-4 border border-emerald-100 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left content */}
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Credits</p>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                    ₱{(totalCredits || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available funds ready for disbursement
                  </p>
                </div>

                {/* Icon + Button */}
                <div className="flex flex-col items-end gap-2">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-inner">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8c-1.657 0-3 1.343-3 3h6c0-1.657-1.343-3-3-3zM6 8h.01M18 8h.01M6 12h12M6 16h12M6 20h12"
                      />
                    </svg>
                  </div>
                  <button
                      onClick={() => console.log("Request disbursement clicked")}
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md active:scale-95 transition-all duration-200"
                  >
                    Request
                  </button>
                </div>
              </div>
            </div>
          </div>
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
