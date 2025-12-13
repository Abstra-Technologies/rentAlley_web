"use client";

import { useEffect, useState } from "react";
import {
    FiArrowDownCircle,
    FiCalendar,
    FiDownload,
    FiInfo,
    FiLayers,
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
            {/* HEADER */}
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FiArrowDownCircle className="text-blue-600" />
                    My Payouts
                </h1>
                <p className="text-gray-600">
                    Track your earnings and disbursements from Upkyp.
                </p>
            </div>

            {/* LOADING */}
            {loading && (
                <div className="max-w-7xl mx-auto flex justify-center py-20">
                    <FiRefreshCw className="w-10 h-10 animate-spin text-blue-600" />
                </div>
            )}

            {/* ERROR */}
            {!loading && error && (
                <div className="max-w-7xl mx-auto p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <FiXCircle className="inline mr-2" />
                    {error}
                </div>
            )}

            {/* CONTENT GRID */}
            {!loading && !error && (
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ================= PENDING EARNINGS ================= */}
                    <div className="bg-white rounded-xl shadow flex flex-col">
                        <div className="p-5 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FiLayers className="text-yellow-600" />
                                Pending Payouts
                            </h2>
                            <span className="text-lg font-bold text-emerald-600">
                ₱{pendingTotal.toLocaleString()}
              </span>
                        </div>

                        {pendingPayments.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                No pending earnings
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Property</th>
                                        <th className="py-3 px-4 text-left">Unit</th>
                                        <th className="py-3 px-4 text-left">Type</th>
                                        <th className="py-3 px-4 text-left">Amount</th>
                                        <th className="py-3 px-4 text-left">Date</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                    {pendingPayments.map((p) => (
                                        <tr key={p.payment_id}>
                                            <td className="py-3 px-4">{p.property_name}</td>
                                            <td className="py-3 px-4">{p.unit_name}</td>
                                            <td className="py-3 px-4 capitalize">
                                                {p.payment_type.replace("_", " ")}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-green-600">
                                                ₱{Number(p.amount_paid).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ================= PAYOUT HISTORY ================= */}
                    <div className="bg-white rounded-xl shadow flex flex-col">
                        <div className="p-5 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Disbursement History
                            </h2>
                        </div>

                        {payouts.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                No payouts yet
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                    <tr>
                                        <th className="py-3 px-4 text-left">ID</th>
                                        <th className="py-3 px-4 text-left">Date</th>
                                        <th className="py-3 px-4 text-left">Amount</th>
                                        <th className="py-3 px-4 text-left">Method</th>
                                        <th className="py-3 px-4 text-left">Status</th>
                                        <th className="py-3 px-4 text-left">Receipt</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                    {payouts.map((p) => (
                                        <tr key={p.payout_id}>
                                            <td className="py-3 px-4">{p.payout_id}</td>
                                            <td className="py-3 px-4 flex items-center gap-1">
                                                <FiCalendar className="text-gray-400" />
                                                {p.date}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-green-600">
                                                ₱{Number(p.amount).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4">{p.payout_method}</td>
                                            <td className="py-3 px-4">
                          <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                                  p.status
                              )}`}
                          >
                            {p.status}
                          </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {p.receipt_url ? (
                                                    <a
                                                        href={p.receipt_url}
                                                        target="_blank"
                                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <FiDownload /> Download
                                                    </a>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* EMPTY STATE */}
            {!loading &&
                payouts.length === 0 &&
                pendingPayments.length === 0 &&
                !error && (
                    <div className="max-w-7xl mx-auto text-center py-20">
                        <FiInfo className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700">
                            No payouts or earnings yet
                        </h2>
                        <p className="text-gray-500">
                            Your confirmed payments will appear here once available.
                        </p>
                    </div>
                )}
        </div>
    );
}
