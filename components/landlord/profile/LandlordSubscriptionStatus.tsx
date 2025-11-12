"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatDate } from "@/utils/formatter/formatters";
import { Loader2, Crown, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Subscription {
    plan_name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    payment_status: string;
}

export default function LandlordSubscriptionStatus({
                                                       landlordId,
                                                   }: {
    landlordId: number;
}) {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlordId) return;

        async function fetchSubscription() {
            try {
                const res = await axios.get(
                    `/api/landlord/subscription/active/${landlordId}`
                );
                setSubscription(res.data || null);
            } catch (error) {
                console.error("Failed to fetch subscription:", error);
                setSubscription(null);
            } finally {
                setLoading(false);
            }
        }

        fetchSubscription();
    }, [landlordId]);

    if (loading)
        return (
            <div className="flex items-center justify-center py-6 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm font-medium">Loading subscription...</span>
            </div>
        );

    const isExpired =
        !subscription || new Date(subscription.end_date) < new Date();

    return (
        <div className="relative w-full max-w-2xl mx-auto flex justify-center px-3 sm:px-0 transition-all duration-300">
            {/* 💎 Subscription Card */}
            <div
                className="w-full bg-gradient-to-br from-white to-gray-50 border border-gray-100/70
      dark:from-gray-900 dark:to-gray-800 dark:border-gray-700
      rounded-2xl shadow-sm sm:shadow-md p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between
      transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
            >
                {/* Left Section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-md shadow-inner">
                        <Crown className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-gray-800 dark:text-gray-100 text-sm sm:text-base font-semibold">
                        Subscription
                    </h2>
                </div>

                {/* Right Section */}
                {subscription && !isExpired ? (
                    <div className="flex flex-col items-end text-right mt-3 sm:mt-0">
                        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm sm:text-base leading-tight truncate max-w-[120px] sm:max-w-none">
                            {subscription.plan_name}
                        </p>
                        <p className="flex items-center justify-end gap-1 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Ends</span>{" "}
                            <strong className="text-gray-800 dark:text-gray-200">
                                {formatDate(subscription.end_date)}
                            </strong>
                        </p>
                        <span
                            className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/40
            border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400
            rounded-md text-[10px] sm:text-[11px] font-medium"
                        >
            Active
          </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-end text-right mt-3 sm:mt-0">
                        <div className="flex items-center justify-end gap-1 text-[11px] sm:text-xs text-gray-700 dark:text-gray-400 mb-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="font-medium text-red-600 dark:text-red-400">
              Expired
            </span>
                        </div>
                        <Link
                            href="/pages/landlord/sub_two/subscription"
                            className="px-3 py-1.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-white
            rounded-md bg-gradient-to-r from-blue-600 to-emerald-600
            hover:from-blue-700 hover:to-emerald-700 shadow-sm active:scale-95 transition-all duration-200"
                        >
                            Renew Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );


}
