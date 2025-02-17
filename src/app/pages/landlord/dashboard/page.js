"use client";
import { useEffect, useState } from "react";
import useAuth from "../../../../../hooks/useSession";
import axios from "axios";
import {useRouter} from "next/navigation";
import Navbar from "../../../../components/navigation/navbar";
import LandlordSubscription from "../../../../components/landlord/subscrription";
import Link from "next/link";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";

export default function LandlordDashboard() {
    const { user, loading, error } = useAuth();
    const router = useRouter();

    if (loading) return <p>Loading user data...</p>;
    if (error) return <p>Error loading user session: {error}</p>;

    const subscription = user?.subscription ?? null;
    const trialEndDate = user?.subscription?.trial_end_date || "N/A";

    return (
        <LandlordLayout>
        <div>
            <div>
                {/* <p>Side Nav Contents</p> */}
                <Link href="/pages/commons/bug-report">Report a Bug</Link>
            </div>
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Landlord Dashboard</h1>

            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User Type:</strong> {user?.userType}</p>
            <p><strong>ID:</strong> {user?.landlord_id}</p>

            <h2 className="text-xl font-bold mt-4">Subscription Details</h2>
            {subscription ? (
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-xl font-semibold text-blue-600">Your Subscription</h2>
                    {/*<p><strong>Subscription ID:</strong> {subscription.subscription_id}</p>*/}
                    <p><strong>Plan Name:</strong> {subscription.plan_name}</p>
                    <p><strong>Status:</strong> {subscription.status}</p>
                    <p><strong>Start Date:</strong> {subscription.start_date}</p>
                    <p><strong>End Date:</strong> {subscription.end_date}</p>
                    <p><strong>Payment Status:</strong> {subscription.payment_status}</p>
                    <p><strong>Trial End Date:</strong> {trialEndDate}</p>

                </div>
            ) : (
                <p>No active subscription found.</p>
            )}

            <div>
                <p>View Subscription</p>
            </div>
        </div>
        </div>
        </LandlordLayout>
    );
}
