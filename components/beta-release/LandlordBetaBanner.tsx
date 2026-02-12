"use client";

import {
    Rocket,
    ArrowRight,
    CheckCircle,
    X,
} from "lucide-react";
import useSWR from "swr";
import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LandlordBetaBanner() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    const statusKey = user?.user_id
        ? `/api/landlord/subscription/status?user_id=${user?.user_id}`
        : null;

    const { data, isLoading } = useSWR(statusKey, fetcher);

    const hasSubscription = data?.has_subscription;
    const isBetaActive = data?.plan_code === "BETA";
    const endDate = data?.end_date;


    /* ================= COUNTDOWN ================= */
    const remainingDays = useMemo(() => {
        if (!endDate) return null;

        const today = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        return days > 0 ? days : 0;
    }, [endDate]);

    /* ================= REDIRECT ================= */
    const handleJoinBeta = () => {
        router.push("/pages/landlord/beta-program/joinForm");
    };

    if (isLoading) return null;

    /* ================= CASE 1: BETA ACTIVE ================= */
    if (isBetaActive) {
        if (dismissed) return null;

        return (
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <p className="text-xs sm:text-sm font-medium truncate">
                                <span className="font-semibold">
                                    Beta Program Active
                                </span>

                                {remainingDays !== null && (
                                    <span className="hidden sm:inline">
                                        {" "}
                                        — {remainingDays} day
                                        {remainingDays !== 1 && "s"} remaining
                                    </span>
                                )}
                            </p>
                        </div>


                    </div>
                </div>
            </div>
        );
    }

    /* ================= CASE 2: HAS OTHER SUBSCRIPTION ================= */
    if (hasSubscription) {
        return null;
    }

    /* ================= CASE 3: NO SUBSCRIPTION ================= */
    return (
        <div className="px-3 sm:px-4 pt-3 sm:pt-4">
            <div className="max-w-7xl mx-auto rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-md p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <Rocket className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold truncate">
                                Join UpKyp Beta 🚀
                            </h3>
                            <p className="text-xs sm:text-sm text-white/80">
                                Get 60 days of premium access — completely free
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleJoinBeta}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                            text-sm font-bold px-4 py-2.5 rounded-lg
                            bg-white text-gray-900 hover:bg-white/90 transition-all"
                    >
                        Join Beta
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
