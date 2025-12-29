"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import useAuthStore from "@/zustand/authStore";
import { ReceiptText, History } from "lucide-react";

interface Payment {
    payment_id: number;
    tenant_name: string;
    unit_name: string;
    payment_type: string;
    amount_paid: number;
    payment_method_id: string;
    payment_status: string;
    payment_date: string;
    payout_status: string;
    lease_status: "active" | "completed" | "expired";
}

export default function PropertyPaymentsPage() {
    const { id } = useParams();
    const property_id = id as string;

    const { user, fetchSession } = useAuthStore();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPast, setShowPast] = useState(false);

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    useEffect(() => {
        if (!property_id || !user?.landlord_id) return;

        const fetchPayments = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    "/api/landlord/payments/getPerProperty",
                    {
                        params: {
                            property_id,
                            landlord_id: user.landlord_id,
                        },
                    }
                );

                setPayments(res.data.payments || []);
            } catch {
                setError("Failed to load property payments.");
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [property_id, user?.landlord_id]);

    const activePayments = payments.filter(
        (p) => p.lease_status === "active"
    );

    const pastPayments = payments.filter(
        (p) => p.lease_status !== "active"
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

            {/* HEADER */}
            <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <ReceiptText className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">
                        Property Payments
                    </h1>
                    <p className="text-sm text-gray-600">
                        Current and past lease payment history
                    </p>
                </div>
            </div>

            {/* CURRENT PAYMENTS */}
            <Section
                title="Current Lease Payments"
                emptyText="No payments for active leases."
                payments={activePayments}
                loading={loading}
                error={error}
            />

            {/* PAST PAYMENTS */}
            <div className="mt-6">
                <button
                    onClick={() => setShowPast(!showPast)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                    <History className="w-4 h-4" />
                    {showPast ? "Hide" : "Show"} Past Lease Payments
                </button>

                {showPast && (
                    <div className="mt-4">
                        <Section
                            title="Past Lease Payments"
                            emptyText="No past lease payments."
                            payments={pastPayments}
                            loading={loading}
                            error={error}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================================
   REUSABLE TABLE SECTION
================================ */

function Section({
                     title,
                     payments,
                     loading,
                     error,
                     emptyText,
                 }: {
    title: string;
    payments: Payment[];
    loading: boolean;
    error: string | null;
    emptyText: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden mt-4">
            <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-800">{title}</h2>
            </div>

            {loading && (
                <div className="p-6 text-center text-gray-500">
                    Loading payments…
                </div>
            )}

            {error && (
                <div className="p-6 text-center text-red-500">
                    {error}
                </div>
            )}

            {!loading && payments.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                    {emptyText}
                </div>
            )}

            {!loading && payments.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-600">
                        <tr>
                            <th className="px-4 py-3">Tenant</th>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Method</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Paid At</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {payments.map((p) => (
                            <tr key={p.payment_id}>
                                <td className="px-4 py-3 font-medium">
                                    {p.tenant_name}
                                </td>
                                <td className="px-4 py-3">
                                    {p.unit_name}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {p.payment_type.replace("_", " ")}
                                </td>
                                <td className="px-4 py-3 font-semibold">
                                    {formatCurrency(p.amount_paid)}
                                </td>
                                <td className="px-4 py-3 uppercase text-xs">
                                    {p.payment_method_id}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            p.payment_status === "confirmed"
                                                ? "bg-green-100 text-green-700"
                                                : p.payment_status === "failed"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {p.payment_status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {formatDate(p.payment_date)}
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
