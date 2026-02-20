"use client";

import { useEffect, useState } from "react";
import {
    FiArrowDownCircle,
    FiRefreshCw,
    FiXCircle,
} from "react-icons/fi";
import useAuthStore from "@/zustand/authStore";

export default function PayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/landlord/payout?landlord_id=${landlordId}`);
            if (!res.ok) throw new Error("Failed to load payouts");

            const data = await res.json();
            setPayouts(data.payouts || []);
            setPendingPayments(data.pending_payments || []);
            setPendingTotal(data.pending_total || 0);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (landlordId) fetchPayouts();
    }, [landlordId]);

    const statusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-emerald-100 text-emerald-700";
            case "processing":
                return "bg-blue-100 text-blue-700";
            case "pending":
                return "bg-amber-100 text-amber-700";
            case "failed":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                {/* HEADER */}
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FiArrowDownCircle className="text-blue-600" />
                        Payout Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Monitor earnings and disbursement history.
                    </p>
                </div>

                {/* LOADING */}
                {loading && (
                    <div className="flex justify-center py-16">
                        <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        <FiXCircle className="inline mr-2" />
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* SUMMARY CARDS */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-6">
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow p-3 sm:p-6">
                                <p className="text-[11px] sm:text-sm text-gray-500">
                                    Available
                                </p>
                                <h2 className="text-sm sm:text-3xl font-bold text-emerald-600 mt-1 sm:mt-2">
                                    ₱{pendingTotal.toLocaleString()}
                                </h2>
                            </div>

                            <div className="bg-white rounded-xl sm:rounded-2xl shadow p-3 sm:p-6">
                                <p className="text-[11px] sm:text-sm text-gray-500">
                                    Processing
                                </p>
                                <h2 className="text-sm sm:text-3xl font-bold text-amber-600 mt-1 sm:mt-2">
                                    ₱
                                    {pendingPayments
                                        .filter((p) => p.payout_status === "in_payout")
                                        .reduce((sum, p) => sum + Number(p.net_amount), 0)
                                        .toLocaleString()}
                                </h2>
                            </div>

                            <div className="bg-white rounded-xl sm:rounded-2xl shadow p-3 sm:p-6">
                                <p className="text-[11px] sm:text-sm text-gray-500">
                                    Disbursed
                                </p>
                                <h2 className="text-sm sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
                                    ₱
                                    {payouts
                                        .reduce((sum, p) => sum + Number(p.amount), 0)
                                        .toLocaleString()}
                                </h2>
                            </div>
                        </div>

                        {/* AVAILABLE PAYMENTS */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
                                <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                    Available Earnings
                                </h2>
                            </div>

                            {pendingPayments.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    No available earnings
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {pendingPayments.map((p) => (
                                        <div
                                            key={p.payment_id}
                                            className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {p.property_name} • {p.unit_name}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {p.payment_type.replaceAll("_", " ")}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(p.created_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="text-sm font-bold text-emerald-600">
                                                ₱{Number(p.net_amount).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DISBURSEMENT HISTORY */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
                                <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                    Disbursement History
                                </h2>
                            </div>

                            {payouts.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    No payouts yet
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {payouts.map((p) => (
                                        <div
                                            key={p.payout_id}
                                            className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Payout #{p.payout_id}
                                                </p>
                                                <p className="text-xs text-gray-500">{p.date}</p>
                                                <p className="text-xs text-gray-500">
                                                    {p.payout_method}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-blue-600">
                          ₱{Number(p.amount).toLocaleString()}
                        </span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(
                                                        p.status
                                                    )}`}
                                                >
                          {p.status}
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}