"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { BackButton } from "@/components/navigation/backButton";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import useAuthStore from "@/zustand/authStore";
import {ReceiptText} from "lucide-react";

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
}

export default function PropertyPaymentsPage() {
    const { id } = useParams();
    const property_id = id as string;

    const { user, fetchSession } = useAuthStore();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure session is loaded
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    useEffect(() => {
        if (!property_id || !user?.landlord_id) return;

        const fetchPayments = async () => {
            try {
                setLoading(true);
                setError(null);

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

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-6">
                {/* Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ReceiptText className="w-5 h-5 text-white" />
                </div>

                {/* Title & Description */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        Property Payments
                    </h1>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                        View and track all payments collected for this property
                    </p>
                </div>
            </div>


            {/* Content */}
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
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

                {!loading && !error && payments.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        No payments found for this property.
                    </div>
                )}

                {!loading && payments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                            <tr className="text-left text-gray-600">
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
                            {payments.map((payment) => (
                                <tr key={payment.payment_id}>
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {payment.tenant_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {payment.unit_name}
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        {payment.payment_type.replace("_", " ")}
                                    </td>
                                    <td className="px-4 py-3 font-semibold">
                                        {formatCurrency(payment.amount_paid)}
                                    </td>
                                    <td className="px-4 py-3 uppercase text-xs">
                                        {payment.payment_method_id}
                                    </td>
                                    <td className="px-4 py-3">
                      <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.payment_status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : payment.payment_status === "failed"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {payment.payment_status}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {formatDate(payment.payment_date)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
