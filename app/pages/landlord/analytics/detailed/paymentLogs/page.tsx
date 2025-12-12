"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import PaymentLogsPage from "@/components/landlord/analytics/detailed/paymentLogs";

export default function PaymentLogs() {
    const { user, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">

            <div className="w-full space-y-6">

                <PaymentLogsPage landlord_id={user?.landlord_id} />

            </div>
        </div>
    );
}
