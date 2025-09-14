
"use client";
import { useState, useEffect } from "react";
import LandlordSubscriptionPlanComponent from "../../../../components/landlord/subscrription";
import SideNavProfile from "../../../../components/navigation/sidebar-profile";
import useAuthStore from "../../../../zustand/authStore";
import LandlordPastSubscriptionsComponent from "@/components/landlord/widgets/LandlordPastSubscriptionsComponent";

export default function LandlordSubscriptionPlan() {
    const { fetchSession, user } = useAuthStore();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [user]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SideNavProfile />

            <div className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
                            <div className="text-center sm:text-left">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                   Your Subscription
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600">
                                    Everything you need to know about our subscription plans and
                                    policies
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                                >
                                    View Policies
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Modal (All Policies Together) */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                    Subscription Policies
                                </h2>

                                {/* Upgrade Policy */}
                                <div className="mb-6">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg
                                                className="w-6 h-6 text-green-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Upgrade Policy
                                        </h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Hestia offers a flexible upgrade policy for subscription
                                        plans. If you choose to upgrade your plan before the current
                                        billing cycle ends, the additional cost will be pro-rated
                                        based on the remaining days of your subscription. This
                                        ensures you only pay for the difference in service level for
                                        the time used.
                                    </p>
                                </div>

                                {/* Free Trial Policy */}
                                <div className="mb-6">
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg
                                                className="w-6 h-6 text-blue-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Free Trial Policy
                                        </h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Each user is eligible for only one free trial period. If a
                                        user has previously used a free trial, they will not be
                                        eligible for another. Users are not required to provide
                                        payment details upon signing up for the free trial.
                                    </p>
                                </div>

                                {/* Refund Policy */}
                                <div>
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg
                                                className="w-6 h-6 text-red-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Refund Policy
                                        </h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Hestia does not offer refunds for subscriptions once a
                                        payment has been processed.
                                    </p>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Subscription Plan */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                 Your Current Plan
                            </h2>
                        </div>

                        <div className="p-4 sm:p-6">
                            <LandlordSubscriptionPlanComponent
                                landlord_id={user?.landlord_id}
                            />
                        </div>

                        <div className="p-4 sm:p-6">
                            <LandlordPastSubscriptionsComponent
                                landlord_id={user?.landlord_id}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

