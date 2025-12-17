"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordMainDashboard from "@/components/landlord/main_dashboard/main_dashboard";
import LandlordBetaBanner from "@/components/beta-release/LandlordBetaBanner";

export default function LandlordDashboard() {
    const { user, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    return (
        <>
            <LandlordBetaBanner />

            <LandlordMainDashboard />
        </>
    );
}
