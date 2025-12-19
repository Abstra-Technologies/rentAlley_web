"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordMainDashboard from "@/components/landlord/main_dashboard/main_dashboard";
import LandlordBetaBanner from "@/components/beta-release/LandlordBetaBanner";

export default function LandlordDashboard() {
    const { user, loading, fetchSession } = useAuthStore();

    // landlord_id is a string
    const landlordId = user?.landlord_id as string | undefined;

    /* ==================== PROACTIVE SESSION CHECK ON MOUNT ==================== */
    useEffect(() => {

        if (!user) {
            fetchSession();
        }
    }, [user, fetchSession]);

    /* ==================== AUTH LOADING STATE ==================== */
    if ((!user && !landlordId)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-6 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-lg font-medium text-gray-700">Loading your dashboard...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait while we prepare everything.</p>
                </div>
            </div>
        );
    }

    /* ==================== MISSING LANDLORD_ID (INCOMPLETE PROFILE) ==================== */
    if (!landlordId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Profile Incomplete</h2>
                    <p className="text-gray-600 mb-6">
                        We couldn't load your dashboard because your landlord profile is not fully set up.
                    </p>
                    <a
                        href="/pages/landlord/verification"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        Complete Profile Now →
                    </a>
                </div>
            </div>
        );
    }

    /* ==================== MAIN DASHBOARD ==================== */
    return (
        <>
            <LandlordBetaBanner />
            <LandlordMainDashboard landlordId={landlordId} />
        </>
    );
}