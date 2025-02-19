"use client";
import { useEffect, useState } from "react";
import useAuth from "../../../../../hooks/useSession";
import axios from "axios";
import {useRouter} from "next/navigation";
import Navbar from "../../../../components/navigation/navbar";
import LandlordSubscription from "../../../../components/landlord/subscrription";
import Link from "next/link";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import useAuthStore from "../../../../pages/zustand/authStore";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";

export default function LandlordDashboard() {
    const { user, admin, fetchSession, loading } = useAuthStore();

    const router = useRouter();

    useEffect(() => {
        fetchSession();
    }, []);

    useEffect(() => {
        if (!loading && !user && !admin) {

        }
    }, [user, admin, loading, router]);

    if (loading) {
        return <p>Loading...</p>;
    }
    if (!user) {
        return <p>You need to log in to access the dashboard.</p>;
    }

    const subscription = user?.subscription ?? null;
    const trialEndDate = user?.subscription?.trial_end_date || "N/A";

    return (
        <LandlordLayout>
        <div>
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Landlord Dashboard</h1>

            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User Type:</strong> {user?.userType}</p>
            <p><strong>ID:</strong> {user?.landlord_id}</p>
        </div>
            <LandlordPropertyChart/>
        </div>
        </LandlordLayout>
    );
}
