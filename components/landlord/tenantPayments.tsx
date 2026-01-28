"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { formatCurrency } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to fetch payments");
    return data;
};

interface Props {
    landlord_id?: string;
    search?: string;
    paymentType?: string;
    dateRange?: string;
}

export default function PaymentList({
                                        landlord_id,
                                        search = "",
                                        paymentType = "all",
                                        dateRange = "30",
                                    }: Props) {
    const router = useRouter();

    /* -----------------------
       BUILD QUERY STRING
    ----------------------- */
    const query = useMemo(() => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (paymentType !== "all") params.set("paymentType", paymentType);
        if (dateRange) params.set("dateRange", dateRange);
        return params.toString();
    }, [search, paymentType, dateRange]);

    const {
        data: payments = [],
        isLoading,
        error,
    } = useSWR(
        landlord_id
            ? `/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}&${query}`
            : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

    /* =========================
        LOADING
    ========================== */
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    /* =========================
        ERROR
    ========================== */
    if (error) {
        return (
            <div className="bg-white rounded-xl border p-6 text-sm text-red-600">
                {(error as Error).message}
            </div>
        );
    }

    /* =========================
        EMPTY
    ========================== */
    if (!payments.length) {
        return (
            <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-500">
                No payment records found.
            </div>
        );
    }

    /* =========================
        TABLE
    ========================== */
    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50 border-b">
                    <tr className="text-xs font-semibold text-gray-600 uppercase">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Tenant</th>
                        <th className="px-4 py-3 text-left">Property / Unit</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y">
                    {payments.map((payment: any) => (
                        <tr
                            key={payment.payment_id}
                            className="hover:bg-gray-50 transition"
                        >
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(payment.payment_date).toLocaleDateString()}
                            </td>

                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {payment.tenant_name || "—"}
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-600">
                                {payment.property_name} • {payment.unit_name}
                            </td>

                            <td className="px-4 py-3 text-sm capitalize text-gray-600">
                                {payment.payment_type.replace("_", " ")}
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-right text-emerald-700">
                                {formatCurrency(payment.amount_paid)}
                            </td>

                            <td className="px-4 py-3 text-center">
                                <StatusBadge status={payment.payment_status} />
                            </td>

                            <td className="px-4 py-3 text-center">
                                <button
                                    onClick={() =>
                                        router.push(
                                            "/pages/landlord/analytics/detailed/paymentLogs"
                                        )
                                    }
                                    className="text-blue-600 hover:text-emerald-600 transition"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* =========================
    STATUS BADGE
========================== */
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        confirmed: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        failed: "bg-red-100 text-red-700",
        cancelled: "bg-gray-100 text-gray-600",
    };

    return (
        <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                styles[status] || "bg-gray-100 text-gray-600"
            }`}
        >
      {status}
    </span>
    );
}
