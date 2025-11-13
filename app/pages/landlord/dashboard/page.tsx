"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import LandlordMainDashboard from "@/components/landlord/main_dashboard/main_dashboard";

export default function LandlordDashboard() {
    const { user, fetchSession } = useAuthStore();

    // Fetch user session if not already loaded
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    return (
            <div className="w-full min-h-screen overflow-x-hidden bg-gray-50">
                <LandlordMainDashboard />
            </div>
    );
}
