"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";

interface LeaseAgreement {
    agreement_id: number;
    start_date: string;
    end_date: string;
    duration: number;
    status: "active" | "inactive" | string;
}

interface LeaseDurationTrackerProps {
    agreement_id: number;
}

export default function LeaseDurationTracker({ agreement_id }: LeaseDurationTrackerProps) {
    const [lease, setLease] = useState<LeaseAgreement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLease() {
            try {
                const res = await axios.get<{ lease: LeaseAgreement[] }>(
                    `/api/tenant/dashboard/getLeaseWidget?agreement_id=${agreement_id}`
                );
                setLease(res.data.lease[0]);
            } catch (err: any) {
                console.error("Error fetching lease:", err);
                setError(err.response?.data?.message || "Failed to load lease data.");
            } finally {
                setLoading(false);
            }
        }
        if (agreement_id) fetchLease();
    }, [agreement_id]);

    if (loading)
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
            </div>
        );

    if (error)
        return (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
            </div>
        );

    if (!lease)
        return (
            <div className="text-center text-gray-500 text-sm py-6">
                No active lease found.
            </div>
        );

    const start = new Date(lease.start_date);
    const end = new Date(lease.end_date);
    const today = new Date();

    const totalDays = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1);
    const elapsedDays = Math.min(
        Math.max((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0),
        totalDays
    );
    const remainingDays = Math.max(totalDays - elapsedDays, 0);
    const progressPercent = (elapsedDays / totalDays) * 100;

    const isExpiringSoon = remainingDays <= 30;
    const isExpired = remainingDays === 0;

    const endColor = isExpired
        ? "text-red-600"
        : isExpiringSoon
            ? "text-amber-600"
            : "text-emerald-600";

    const barColor = isExpired
        ? "bg-red-500"
        : isExpiringSoon
            ? "bg-amber-500"
            : "bg-gradient-to-r from-blue-500 to-emerald-500";

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Lease Duration
                </h3>
                <div
                    className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        isExpired
                            ? "bg-red-100 text-red-700"
                            : isExpiringSoon
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                    }`}
                >
                    {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Active"}
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-gray-200 bg-white flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-700">Start</span>
                    </div>
                    <span className="text-gray-900 font-semibold">
            {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
                </div>
                <div
                    className={`p-3 rounded-lg border ${
                        isExpired
                            ? "border-red-200 bg-red-50"
                            : isExpiringSoon
                                ? "border-amber-200 bg-amber-50"
                                : "border-emerald-200 bg-emerald-50"
                    } flex flex-col`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className={`w-4 h-4 ${endColor}`} />
                        <span className={`font-medium ${endColor}`}>End</span>
                    </div>
                    <span className="text-gray-900 font-semibold">
            {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                    <span>{Math.floor(elapsedDays)} days elapsed</span>
                    <span>{Math.ceil(remainingDays)} days left</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Remaining Days */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                    <ClockIcon className={`w-4 h-4 ${endColor}`} />
                    <span className="text-xs font-medium uppercase tracking-wide">Remaining</span>
                </div>
                <div className={`text-2xl font-bold ${endColor}`}>
                    {Math.ceil(remainingDays)}
                    <span className="text-sm ml-1 text-gray-500">days</span>
                </div>
            </div>

            {/* Alerts */}
            {isExpired && (
                <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700">
                    Your lease has ended. Please contact your landlord about renewal or move-out.
                </div>
            )}

            {!isExpired && isExpiringSoon && (
                <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-700">
                    Your lease expires in less than 30 days. Consider discussing renewal options.
                </div>
            )}
        </div>
    );
}
