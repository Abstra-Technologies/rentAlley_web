"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

interface LeaseAgreement {
    agreement_id: number;
    start_date: string;
    end_date: string;
    duration: number;
    status: "active" | "inactive" | "expired" | string;
}

interface LeaseDurationTrackerProps {
    agreement_id: number;
}

export default function LeaseDurationTracker({
                                                 agreement_id,
                                             }: LeaseDurationTrackerProps) {
    const [lease, setLease] = useState<LeaseAgreement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<
        "extend" | "end" | null
    >(null);

    useEffect(() => {
        async function fetchLease() {
            try {
                const res = await axios.get<{ lease: LeaseAgreement[] }>(
                    `/api/tenant/dashboard/getLeaseWidget?agreement_id=${agreement_id}`
                );
                setLease(res.data.lease?.[0] || null);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load lease data.");
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id) fetchLease();
    }, [agreement_id]);

    /* ================= ACTION HANDLERS ================= */
    const handleRequestExtension = async () => {
        try {
            setActionLoading("extend");

            const confirm = await Swal.fire({
                title: "Request Lease Extension?",
                text: "This will notify your landlord that you want to extend the lease.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, request",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#d97706", // amber
            });

            if (!confirm.isConfirmed) {
                setActionLoading(null);
                return;
            }

            await axios.post("/api/tenant/lease/request-extension", {
                agreement_id,
            });

            await Swal.fire({
                icon: "success",
                title: "Request Sent",
                text: "Your lease extension request has been sent to the landlord.",
                confirmButtonColor: "#16a34a",
            });
        } catch (err: any) {
            await Swal.fire({
                icon: "error",
                title: "Request Failed",
                text:
                    err?.response?.data?.error ||
                    "Unable to request lease extension.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleEndLease = async () => {
        try {
            const confirm = await Swal.fire({
                title: "End Lease?",
                html: `
              <p>This action will:</p>
              <ul style="text-align:left; margin-top:8px">
                <li>• Mark the lease as completed</li>
                <li>• Set the unit as unoccupied</li>
                <li>• Notify the landlord</li>
              </ul>
              <p style="margin-top:10px;color:#b91c1c;font-weight:600">
                This action cannot be undone.
              </p>
            `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, end lease",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#dc2626",
            });

            if (!confirm.isConfirmed) return;

            setActionLoading("end");

            await axios.post("/api/tenant/activeRent/endLease", {
                agreement_id,
            });

            await Swal.fire({
                icon: "success",
                title: "Lease Ended",
                text: "The lease has been successfully ended and the landlord has been notified.",
                confirmButtonColor: "#16a34a",
            });

            // OPTIONAL: refresh widget state
            window.location.reload();
        } catch (err: any) {
            await Swal.fire({
                icon: "error",
                title: "Unable to End Lease",
                text:
                    err?.response?.data?.error ||
                    "Please settle all pending dues before ending the lease.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gray-200 rounded-lg" />
                    <div className="h-16 bg-gray-200 rounded-lg" />
                </div>
                <div className="h-20 bg-gray-200 rounded-lg" />
            </div>
        );
    }

    /* ================= ERROR ================= */
    if (error) {
        return (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
        );
    }

    /* ================= EMPTY ================= */
    if (!lease) {
        return (
            <div className="text-center py-6">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No lease data available</p>
            </div>
        );
    }

    /* ================= DATE CALCULATIONS ================= */
    const start = new Date(lease.start_date);
    const end = new Date(lease.end_date);
    const today = new Date();

    const totalDays = Math.max(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        1
    );

    const elapsedDays = Math.min(
        Math.max((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0),
        totalDays
    );

    const remainingDays = Math.max(totalDays - elapsedDays, 0);
    const progressPercent = (elapsedDays / totalDays) * 100;

    const isExpired = remainingDays === 0;
    const isExpiringSoon = remainingDays > 0 && remainingDays <= 30;

    const statusColor = isExpired
        ? "text-red-600"
        : isExpiringSoon
            ? "text-amber-600"
            : "text-emerald-600";

    const statusBg = isExpired
        ? "bg-red-50 border-red-200"
        : isExpiringSoon
            ? "bg-amber-50 border-amber-200"
            : "bg-emerald-50 border-emerald-200";

    const barColor = isExpired
        ? "bg-red-500"
        : isExpiringSoon
            ? "bg-amber-500"
            : "bg-blue-500";

    /* ================= RENDER ================= */
    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            Lease Duration
                        </h3>
                        <p className="text-xs text-gray-600">Contract timeline</p>
                    </div>
                </div>

                <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        isExpired
                            ? "bg-red-100 text-red-700 border-red-200"
                            : isExpiringSoon
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}
                >
          {isExpired ? "Expired" : isExpiringSoon ? "Expiring" : "Active"}
        </span>
            </div>

            {/* DATES */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                        Start
                    </p>
                    <p className="text-sm font-bold">
                        {start.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                </div>

                <div className={`rounded-lg border p-3 ${statusBg}`}>
                    <p className={`text-xs font-semibold uppercase mb-1 ${statusColor}`}>
                        End
                    </p>
                    <p className="text-sm font-bold">
                        {end.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>

            {/* TIME REMAINING */}
            <div className={`rounded-lg border p-4 ${statusBg}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white">
                        <ClockIcon className={`w-5 h-5 ${statusColor}`} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase text-gray-600">
                            Time Remaining
                        </p>
                        <p className={`text-2xl font-bold ${statusColor}`}>
                            {Math.ceil(remainingDays)}{" "}
                            <span className="text-sm font-normal text-gray-600">
                days
              </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* PROGRESS */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs">
          <span className="text-gray-600">
            {Math.floor(elapsedDays)} days passed
          </span>
                    <span className={`font-semibold ${statusColor}`}>
            {Math.round(progressPercent)}%
          </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                        className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* STATUS + ACTIONS */}
            {isExpired && (
                <div className="space-y-3">
                    <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-900">
                                Lease Expired
                            </p>
                            <p className="text-xs text-red-700">
                                This lease is no longer active.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={handleRequestExtension}
                            disabled={actionLoading !== null}
                            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold
                hover:bg-amber-700 disabled:opacity-50"
                        >
                            {actionLoading === "extend"
                                ? "Requesting..."
                                : "Request Extension"}
                        </button>

                        <button
                            onClick={handleEndLease}
                            disabled={actionLoading !== null}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold
                hover:bg-red-700 disabled:opacity-50"
                        >
                            {actionLoading === "end" ? "Ending..." : "End Lease"}
                        </button>
                    </div>
                </div>
            )}

            {!isExpired && isExpiringSoon && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <ClockIcon className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900">
                            Expiring Soon
                        </p>
                        <p className="text-xs text-amber-700">
                            Consider renewal options
                        </p>
                    </div>
                </div>
            )}

            {!isExpired && !isExpiringSoon && (
                <div className="flex gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-900">
                            Active
                        </p>
                        <p className="text-xs text-emerald-700">
                            Lease in good standing
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
