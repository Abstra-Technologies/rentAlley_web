"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import useAuthStore from "../../zustand/authStore";
import { logEvent } from "@/utils/gtag";

export default function LandlordSubscriptionPlanComponent({ landlord_id }) {
    const { fetchSession, user } = useAuthStore();
    const [subscription, setSubscription] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (landlord_id) {
            fetch(`/api/landlord/subscription/active/${landlord_id}`)
                .then((response) => response.json())
                .then((data) => {
                    setSubscription(data);
                    setIsFetching(false);
                })
                .catch((error) => {
                    setFetchError(error.message);
                    setIsFetching(false);
                });
        }
    }, [landlord_id]);

    if (isFetching) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-gray-500 animate-pulse">
                Loading your subscription...
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
                Failed to fetch subscription. Please try again later.
            </div>
        );
    }

    return (
        <div className="relative bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-lg">
            {/* Gradient Top Border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>

            {subscription && subscription.plan_name ? (
                <div className="p-6 sm:p-8 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <Crown className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">
                                {subscription.plan_name}
                            </h2>
                        </div>

                        <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                                subscription.is_active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                        >
              {subscription.is_active ? "Active" : "Expired"}
            </span>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                        <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>
                <strong>Start Date:</strong>{" "}
                                {subscription.start_date
                                    ? new Date(subscription.start_date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    : "N/A"}
              </span>
                        </p>

                        <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <span>
                <strong>End Date:</strong>{" "}
                                {subscription.end_date
                                    ? `${new Date(subscription.end_date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })} at 11:59 PM`
                                    : "N/A"}
              </span>
                        </p>
                    </div>

                    {/* Payment Status */}
                    <p className="text-sm mt-2 text-gray-600">
                        <strong>Payment Status:</strong>{" "}
                        <span
                            className={`font-semibold ${
                                subscription.payment_status === "paid"
                                    ? "text-green-600"
                                    : "text-yellow-600"
                            }`}
                        >
              {subscription.payment_status}
            </span>
                    </p>

                    {/* Alerts and Actions */}
                    {!subscription.is_active ? (
                        <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">
                                    Your subscription has expired. Your account has been downgraded to the free plan.
                                </p>
                                <Link
                                    href="/pages/landlord/sub_two/subscription"
                                    onClick={() =>
                                        logEvent(
                                            "Subscription Expired",
                                            "Subscription",
                                            "User clicked renew",
                                            1
                                        )
                                    }
                                    className="mt-3 inline-block bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition"
                                >
                                    Renew Subscription
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {subscription.is_trial === 1 && (
                                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <p className="text-emerald-700 font-medium">
                                            You’re currently on a free trial until{" "}
                                            <strong>
                                                {new Date(subscription.end_date).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </strong>.
                                        </p>
                                        <Link
                                            href="/pages/landlord/sub_two/upgrade"
                                            onClick={() =>
                                                logEvent(
                                                    "Trial User Subscription",
                                                    "Subscription",
                                                    "Trial user clicked subscribe",
                                                    1
                                                )
                                            }
                                            className="mt-3 inline-block bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition"
                                        >
                                            Subscribe to a Plan
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {subscription.is_trial === 0 && (
                                <Link
                                    href="/pages/landlord/subsciption_plan/pricing"
                                    onClick={() =>
                                        logEvent(
                                            "Upgrade Clicked",
                                            "Subscription",
                                            "User clicked upgrade",
                                            1
                                        )
                                    }
                                    className="mt-5 block bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl text-center shadow-md transition"
                                >
                                    Upgrade Plan
                                </Link>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="p-6 text-center text-gray-700">
                    <p className="mb-4">No active subscription found.</p>
                    <Link
                        href="/pages/landlord/sub_two/subscription"
                        onClick={() =>
                            logEvent(
                                "No Subscription",
                                "Subscription",
                                "User clicked subscribe",
                                1
                            )
                        }
                        className="inline-block bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition"
                    >
                        Subscribe Now
                    </Link>
                </div>
            )}
        </div>
    );
}
