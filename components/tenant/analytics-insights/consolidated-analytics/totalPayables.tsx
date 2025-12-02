"use client";

// USED IN TENANT FEEDS.

import { formatDate } from "@/utils/formatter/formatters";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ExclamationCircleIcon,
    CheckCircleIcon,
    CreditCardIcon,
    HomeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CalendarIcon,
    CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface BillingDetail {
    billing_id: number;
    billing_period: string;
    total_amount_due: number | null;
    status: string;
    due_date: string;
}

interface UnitPayable {
    unit_id: number;
    unit_name: string;
    property_name: string;
    total_due: number | null;
    billing_details: BillingDetail[];
}

interface PayablesResponse {
    total: number;
    details: UnitPayable[];
}

export default function TenantPayables({
                                           tenant_id,
                                       }: {
    tenant_id: number | undefined;
}) {
    const [data, setData] = useState<PayablesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!tenant_id) return;

        setLoading(true);
        fetch(`/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch payables");
                return res.json();
            })
            .then(setData)
            .catch((err) => setError(err.message || "Unable to load payables"))
            .finally(() => setLoading(false));
    }, [tenant_id]);

    const formatPHP = (value: number | null | undefined): string =>
        `₱${(Number(value) || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const handlePayNow = (bill: BillingDetail) => {
        router.push(`/pages/tenant/pay/${bill.billing_id}`);
    };

    const getStatusConfig = (status: string) => {
        const configs = {
            paid: {
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                border: "border-emerald-200",
                dot: "bg-emerald-500",
            },
            overdue: {
                bg: "bg-red-50",
                text: "text-red-700",
                border: "border-red-200",
                dot: "bg-red-500",
            },
            pending: {
                bg: "bg-amber-50",
                text: "text-amber-700",
                border: "border-amber-200",
                dot: "bg-amber-500",
            },
        };
        return configs[status.toLowerCase() as keyof typeof configs] || configs.pending;
    };

    /* ===========================
        STATE HANDLING
       =========================== */
    if (!tenant_id)
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <ExclamationCircleIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 text-center font-medium">
                    Please log in to view your payables.
                </p>
            </div>
        );

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-10 h-10 mb-3">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200"></div>
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500"></div>
                </div>
                <p className="text-sm text-gray-600">Loading payables...</p>
            </div>
        );

    if (error)
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                    <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 font-semibold text-sm">{error}</p>
                <p className="text-xs text-gray-500 mt-1">Please try again later.</p>
            </div>
        );

    if (!data)
        return null;

    /* ===========================
        🔥 FILTER OUT UNITS WITH ZERO PAYABLES
       =========================== */
    const filteredUnits = data.details.filter(
        (unit) => Number(unit.total_due) > 0
    );

    /* If after filtering nothing is left → show "No Outstanding Payables" */
    if (!filteredUnits.length)
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-emerald-700 font-semibold text-sm">
                    No Outstanding Payables
                </p>
                <p className="text-xs text-gray-500 mt-1">All payments are settled.</p>
            </div>
        );

    /* ===========================
        MAIN UI
       =========================== */

    return (
        <div className="w-full">
            {/* HEADER — Collapsible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left px-4 sm:px-5 py-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-emerald-600 rounded-t-xl hover:from-blue-700 hover:to-emerald-700 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-0.5">
                            Total Payables
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-white">
                            {formatPHP(data.total)}
                        </p>
                        <p className="text-xs text-white/70 mt-0.5">
                            {filteredUnits.length}{" "}
                            {filteredUnits.length === 1 ? "unit" : "units"} with balance
                        </p>
                    </div>
                </div>

                <ChevronDownIcon
                    className={`w-5 h-5 text-white transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : "rotate-0"
                    }`}
                />
            </button>

            {/* LIST */}
            <div
                className={`transition-all duration-500 overflow-hidden ${
                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="px-4 sm:px-5 py-4 space-y-3 bg-gray-50 rounded-b-xl border-t border-blue-200">
                    {filteredUnits.map((unit) => (
                        <div
                            key={unit.unit_id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
                        >
                            {/* STATUS BAR */}
                            <div className="h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />

                            {/* UNIT HEADER */}
                            <button
                                onClick={() =>
                                    setExpandedUnit(
                                        expandedUnit === unit.unit_id ? null : unit.unit_id
                                    )
                                }
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <HomeIcon className="w-5 h-5 text-blue-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">
                                            {unit.property_name}
                                        </h4>
                                        <p className="text-xs text-gray-600 truncate">
                                            Unit: {unit.unit_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-3">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-0.5">Amount Due</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {formatPHP(unit.total_due)}
                                        </p>
                                    </div>
                                    {expandedUnit === unit.unit_id ? (
                                        <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                    )}
                                </div>
                            </button>

                            {/* BILLING LIST */}
                            <div
                                className={`transition-all overflow-hidden ${
                                    expandedUnit === unit.unit_id
                                        ? "max-h-[1000px] opacity-100"
                                        : "max-h-0 opacity-0"
                                }`}
                            >
                                <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                                    {unit.billing_details.map((bill) => {
                                        const statusConfig = getStatusConfig(bill.status);
                                        return (
                                            <div
                                                key={bill.billing_id}
                                                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    {/* LEFT */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                                                            <p className="font-semibold text-gray-900 text-sm">
                                                                {formatDate(bill.billing_period)}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-600 ml-6">
                                                            Due: {formatDate(bill.due_date)}
                                                        </p>
                                                    </div>

                                                    {/* RIGHT */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {formatPHP(bill.total_amount_due)}
                                                            </p>
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                />
                                                                {bill.status.charAt(0).toUpperCase() +
                                                                    bill.status.slice(1)}
                              </span>
                                                        </div>

                                                        {bill.status !== "paid" && (
                                                            <button
                                                                onClick={() => handlePayNow(bill)}
                                                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md transition-all"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
