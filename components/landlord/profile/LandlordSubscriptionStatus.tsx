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
                const res = await axios.get(`/api/landlord/subscription/active/${landlordId}`);
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
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading subscription...
            </div>
        );

    const isExpired =
        !subscription || new Date(subscription.end_date) < new Date();

    return (
        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-4 h-[110px] flex flex-col justify-center text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-gray-800 text-sm">Subscription Plan</h2>
            </div>

            {subscription && !isExpired ? (
                <div className="flex flex-col items-center justify-center text-xs text-gray-700">
                    <p className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
            Ends on <strong>{formatDate(subscription.end_date)}</strong>
          </span>
                    </p>
                    <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-md text-[11px] font-medium">
          Active
        </span>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 text-xs text-gray-700 mb-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>Subscription expired — renew to continue.</span>
                    </div>
                    <Link
                        href="/pages/landlord/sub_two/subscription"
                        className="px-3 py-1 text-xs font-semibold text-white rounded-md bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all active:scale-95"
                    >
                        Subscribe
                    </Link>
                </div>
            )}
        </div>
    );



}
