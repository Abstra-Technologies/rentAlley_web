"use client";

import { useEffect, useState } from "react";
import {
    FiArrowDownCircle,
    FiCalendar,
    FiChevronRight,
    FiDownload,
    FiInfo,
    FiLayers,
    FiRefreshCw,
    FiSearch,
    FiXCircle,
} from "react-icons/fi";
import useAuthStore from "@/zustand/authStore";

export default function PayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { user, fetchSession } = useAuthStore();

    const landlordId = user?.landlord_id;

    // Fetch payouts
    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/landlord/payout?landlord_id=${landlordId}`);

            if (!res.ok) throw new Error("Failed to load payouts");
            const data = await res.json();

            setPayouts(data.payouts || []);
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
                return "text-emerald-600 bg-emerald-100";
            case "processing":
                return "text-blue-600 bg-blue-100";
            case "pending":
                return "text-yellow-600 bg-yellow-100";
            case "failed":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-5">
            {/* Page Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FiArrowDownCircle className="text-blue-600" />
                    Payout History
                </h1>
                <p className="text-gray-600">
                    All disbursements made by Upkyp to your payout accounts.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="max-w-6xl mx-auto flex justify-center py-20">
                    <div className="flex flex-col items-center">
                        <FiRefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-700">Loading payout history...</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="max-w-6xl mx-auto p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                        <FiXCircle className="text-red-600" />
                        <p>{error}</p>
                    </div>
                    <button
                        onClick={fetchPayouts}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && payouts.length === 0 && !error && (
                <div className="max-w-6xl mx-auto py-20 text-center">
                    <FiInfo className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                        No payouts recorded yet
                    </h2>
                    <p className="text-gray-500">
                        Once Upkyp processes your disbursements, they will appear here.
                    </p>
                </div>
            )}

            {/* Payout Table */}
            {!loading && payouts.length > 0 && (
                <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="p-5 border-b flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Disbursement Log</h2>

                        {/* Search bar */}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search payout ID..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="py-3 px-4 text-left">Payout ID</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Amount</th>
                            <th className="py-3 px-4 text-left">Method</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Receipt</th>
                            <th className="py-3 px-4 text-right"></th>
                        </tr>
                        </thead>

                        <tbody className="divide-y">
                        {payouts.map((payout) => (
                            <tr key={payout.payout_id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{payout.payout_id}</td>
                                <td className="py-3 px-4 flex items-center gap-1 text-gray-600">
                                    <FiCalendar className="text-gray-400" />
                                    {payout.date}
                                </td>
                                <td className="py-3 px-4 font-semibold text-green-600">
                                    ₱{Number(payout.amount).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-gray-700">{payout.method}</td>

                                <td className="py-3 px-4">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                            payout.status
                        )}`}
                    >
                      {payout.status}
                    </span>
                                </td>

                                <td className="py-3 px-4">
                                    {payout.receipt_url ? (
                                        <a
                                            href={payout.receipt_url}
                                            target="_blank"
                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                        >
                                            <FiDownload />
                                            Download
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>

                                <td className="py-3 px-4 text-right">
                                    <button className="flex items-center text-blue-600 hover:underline">
                                        Details <FiChevronRight className="ml-1" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
