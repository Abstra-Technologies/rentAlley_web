"use client";

import useSWR from "swr";
import { formatCurrency } from "@/utils/formatter/formatters";
import { Receipt, Building2 } from "lucide-react";

/* ---------------- Fetcher ---------------- */
const fetcher = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch payments");
    }

    return data;
};

export default function PaymentList({
                                        landlord_id,
                                    }: {
    landlord_id?: string;
}) {
    const {
        data: payments = [],
        isLoading,
        error,
    } = useSWR(
        landlord_id
            ? `/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        }
    );

    /* ---------------- LOADING ---------------- */
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[500px] flex flex-col">
                <Header />
                <div className="space-y-2 animate-pulse flex-1">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ---------------- ERROR ---------------- */
    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[500px] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Receipt className="w-6 h-6 text-red-500" />
                        </div>
                        <p className="text-sm font-medium text-red-600 mb-1">
                            Error Loading Payments
                        </p>
                        <p className="text-xs text-gray-600">
                            {(error as Error).message}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ---------------- EMPTY ---------------- */
    if (!payments.length) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[500px] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Receipt className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                            No Payments Yet
                        </p>
                        <p className="text-xs text-gray-600">
                            Tenant payments will appear here once available.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ---------------- LIST ---------------- */
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <Header />
                <span className="text-xs text-gray-500">
          {payments.length} total
        </span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
                {payments.slice(0, 6).map((payment: any) => (
                    <div
                        key={payment.payment_id}
                        className="p-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                    <p className="text-xs font-semibold text-gray-900 truncate">
                                        {payment.tenant_name || "Unknown Tenant"}
                                    </p>
                                    <span className="text-xs font-bold text-emerald-700 flex-shrink-0">
                    {formatCurrency(payment.amount_paid)}
                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-0.5">
                                    <Building2 className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                    {payment.property_name} • {payment.unit_name}
                  </span>
                                </div>

                                <p className="text-xs text-gray-500">
                                    {payment.payment_date || "No timestamp"}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {payments.length > 6 && (
                    <p className="text-center text-xs text-gray-500 pt-2">
                        +{payments.length - 6} more payments
                    </p>
                )}
            </div>
        </div>
    );
}

/* ---------------- Header ---------------- */
function Header() {
    return (
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full" />
            <h2 className="text-sm md:text-base font-semibold text-gray-900">
                Recent Payments
            </h2>
        </div>
    );
}
