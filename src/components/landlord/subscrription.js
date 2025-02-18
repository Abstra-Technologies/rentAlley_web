"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useAuth from "../../../hooks/useSession";

export default function LandlordSubscriptionPlanComponent({ landlord_id }) {
    const { user, loading, error } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        if (landlord_id) {
            fetch(`/api/subscription/${landlord_id}`)
                .then(response => response.json())
                .then(data => setSubscription(data))
        }
    }, [landlord_id]);


    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error loading subscription details.</p>;

    return (
        <div>
            <h1>Your Subscription Plan, {user?.firstName}</h1>
            <div>
                {subscription && subscription.plan_name ? (
                    <div className="bg-white shadow rounded-lg p-4">
                        <h2 className="text-xl font-semibold text-blue-600">Your Subscription</h2>

                        <p><strong>Plan Name:</strong> {subscription?.plan_name}</p>
                        <p><strong>Status:</strong> {subscription?.status}</p>
                        <p><strong>Start Date:</strong> {subscription?.start_date}</p>
                        <p><strong>End Date:</strong> {subscription?.end_date}</p>
                        <p><strong>Payment Status:</strong> {subscription?.payment_status}</p>
                        <p><strong>Trial End Date:</strong> {subscription?.trial_end_date}</p>
                    </div>
                ) : (
                    <div>
                        <p className='m-2'>No active subscription found.</p>
                        <Link href='/pages/landlord/sub_two/subscription' className='m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
                            Subscribe Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
