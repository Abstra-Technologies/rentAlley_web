"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import PaymentLogsPage from "@/components/landlord/analytics/detailed/paymentLogs";

export default function PaymentLogs() {
    const { user, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    return (
        <LandlordLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* 🔹 Page Header */}
                    <div className="flex items-center justify-between mb-4">
                    </div>
                    <PaymentLogsPage landlord_id={user?.landlord_id} />
                </div>
            </div>
        </LandlordLayout>
    );
}
