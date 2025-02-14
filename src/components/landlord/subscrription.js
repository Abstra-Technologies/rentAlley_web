"use client";
import React from "react";

const LandlordSubscription = ({ user }) => {
    if (!user) return <p className="text-red-500">No user data available.</p>;

    const subscription = user?.subscription;
    const isTrialUsed = user?.is_trial_used ?? false;

    return (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-semibold text-blue-600">Landlord Subscription Details</h2>

            {/* 🔹 Show Trial Status */}
            <div className={`p-4 mt-4 rounded-lg text-white ${isTrialUsed ? "bg-red-500" : "bg-green-500"}`}>
                <p className="text-lg font-semibold">
                    {isTrialUsed ? "Trial Used" : "Trial Active"}
                </p>
                {subscription?.trial_end_date && (
                    <p><strong>Trial Ends On:</strong> {subscription.trial_end_date}</p>
                )}
            </div>

            {/* 🔹 Show Subscription Details if available */}
            {subscription ? (
                <div className="mt-4">
                    <h3 className="text-xl font-semibold">Your Subscription</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <p><strong>Subscription ID:</strong> {subscription.subscription_id || "N/A"}</p>
                        <p><strong>Plan Name:</strong> {subscription.plan_name || "N/A"}</p>
                        <p><strong>Status:</strong> {subscription.status || "N/A"}</p>
                        <p><strong>Start Date:</strong> {subscription.start_date || "N/A"}</p>
                        <p><strong>End Date:</strong> {subscription.end_date || "N/A"}</p>
                        <p><strong>Payment Status:</strong> {subscription.payment_status || "N/A"}</p>
                        <p><strong>Trial:</strong> {subscription.trial_end_date || "N/A"}</p>

                    </div>
                </div>
            ) : (
                <p className="mt-4 text-gray-600">No active subscription found.</p>
            )}

            {/* 🔹 Show Additional Landlord-Specific Details */}
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700">Landlord Information</h3>
                <p><strong>Landlord ID:</strong> {user.landlord_id || "N/A"}</p>
                <p><strong>Email:</strong> {user.email || "N/A"}</p>
            </div>
        </div>
    );
};

export default LandlordSubscription;
