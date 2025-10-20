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
        <div className="w-full">
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl shadow-md p-4 border border-emerald-100 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left section: Label */}
                    <div className="flex items-center gap-2">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-inner">
                            <Crown className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-gray-800 text-sm font-semibold">
                            Subscription Plan
                        </h2>
                    </div>

                    {/* Right section: Plan details */}
                    {subscription && !isExpired ? (
                        <div className="flex flex-col items-end text-right">
                            <p className="text-gray-900 font-bold text-base leading-tight">
                                {subscription.plan_name}
                            </p>
                            <p className="flex items-center justify-end gap-1.5 text-sm text-gray-600 mt-1">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                Ends on{" "}
                                <strong className="text-gray-800">
                                    {formatDate(subscription.end_date)}
                                </strong>
                            </p>
                            <span className="inline-block mt-2 px-3 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[12px] font-medium">
                Active
              </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end text-right">
                            <div className="flex items-center justify-end gap-1 text-sm text-gray-700 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="font-medium">Expired</span>
                            </div>
                            <Link
                                href="/pages/landlord/sub_two/subscription"
                                className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md active:scale-95 transition-all duration-200"
                            >
                                Subscribe
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
