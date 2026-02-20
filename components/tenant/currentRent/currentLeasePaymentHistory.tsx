"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    CreditCardIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
    BanknotesIcon,
    ReceiptPercentIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

/* ================= TYPES ================= */

interface Payment {
    payment_id: number;
    bill_id?: string;
    receipt_reference?: string;
    gateway_transaction_ref?: string;
    billing_period?: string;
    payment_date: string;
    payment_type: string;
    amount_paid: number;
    payment_status: "confirmed" | "pending" | "failed" | "cancelled";
}

interface Lease {
    agreement_id: string;
    property_name: string;
    unit_name: string;
    start_date: string;
    end_date: string;
}

export default function TenantLeasePayments({
                                                agreement_id,
                                            }: {
    agreement_id: string;
}) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [lease, setLease] = useState<Lease | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefetching, setIsRefetching] = useState(false);

    /* ================= FETCH ================= */

    const fetchPayments = async () => {
        try {
            setIsRefetching(true);

            const res = await axios.get(
                `/api/tenant/payment/currentPaymentHistory`,
                { params: { agreement_id } }
            );

            if (res.status === 200) {
                setLease(res.data?.leaseAgreement || null);
                setPayments(res.data?.payments || []);
                setError(null);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                "Unable to fetch payment history."
            );
        } finally {
            setIsRefetching(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchPayments().finally(() => setLoading(false));
    }, [agreement_id]);

    /* ================= SUMMARY ================= */

    const confirmedPayments = payments.filter(
        (p) => p.payment_status === "confirmed"
    );

    const totalPaid = confirmedPayments.reduce(
        (sum, p) => sum + Number(p.amount_paid),
        0
    );

    /* ================= STATUS HELPERS ================= */

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "pending":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "failed":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    /* ================= LOADING ================= */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading payment history...
            </div>
        );
    }

    /* ================= MAIN UI ================= */

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 pt-20 pb-10 md:px-6 md:pt-6">

            {/* HEADER */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl">
                        <ReceiptPercentIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Payment History
                        </h1>
                        <p className="text-sm text-gray-600">
                            Complete record of your payments
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchPayments}
                    disabled={isRefetching}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-blue-50"
                >
                    <ArrowPathIcon
                        className={`w-5 h-5 text-blue-600 ${
                            isRefetching ? "animate-spin" : ""
                        }`}
                    />
                    Refresh
                </button>
            </div>

            {/* ERROR */}
            {error && <ErrorBoundary error={error} onRetry={fetchPayments} />}

            {/* NO LEASE */}
            {!error && lease === null && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    No active lease found.
                </div>
            )}

            {/* NO PAYMENTS */}
            {!error && lease && payments.length === 0 && (
                <div className="text-center py-16">
                    <CreditCardIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-600">
                        No payment records found for this lease.
                    </p>
                </div>
            )}

            {/* PAYMENTS */}
            {!error && lease && payments.length > 0 && (
                <div className="space-y-8">

                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            label="Total Payments"
                            value={payments.length}
                            icon={<ChartBarIcon className="w-5 h-5 text-blue-600" />}
                        />
                        <StatCard
                            label="Confirmed Payments"
                            value={confirmedPayments.length}
                            icon={<CheckCircleIcon className="w-5 h-5 text-emerald-600" />}
                        />
                        <StatCard
                            label="Total Paid"
                            value={formatCurrency(totalPaid)}
                            icon={<BanknotesIcon className="w-5 h-5 text-amber-600" />}
                        />
                    </div>

                    {/* TABLE */}
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 text-left">Receipt No.</th>
                                <th className="px-6 py-4 text-left">Reference No.</th>

                                <th className="px-6 py-4 text-left">Billing Period</th>
                                <th className="px-6 py-4 text-left">Date Paid</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y">
                            {payments.map((p) => (
                                <tr key={p.payment_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono">
                                        {p.receipt_reference ||
                                            p.gateway_transaction_ref ||
                                            `RCPT-${p.payment_id}`}
                                    </td>
                                    <td className="px-6 py-4 font-mono">
                                        {p.gateway_transaction_ref
                                          }
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.billing_period_label}
                                    </td>

                                    <td className="px-6 py-4">
                                        {formatDate(p.payment_date)}
                                    </td>

                                    <td className="px-6 py-4 text-right font-semibold">
                                        {formatCurrency(p.amount_paid)}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                      <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${getStatusBadge(
                              p.payment_status
                          )}`}
                      >
                        {p.payment_status.toUpperCase()}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ================= SMALL COMPONENT ================= */

function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                    {label}
                </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}