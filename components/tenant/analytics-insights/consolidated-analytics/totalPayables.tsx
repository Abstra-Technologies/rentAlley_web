"use client";

import { formatDate } from "@/utils/formatter/formatters";
import { useEffect, useState } from "react";
import {
    FaHome,
    FaMoneyBillWave,
    FaChevronDown,
    FaChevronUp,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
    ExclamationCircleIcon,
    CheckCircleIcon,
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

    // State handling (empty/loading/error)
    if (!tenant_id) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <ExclamationCircleIcon className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-gray-600 text-center text-sm font-medium">
                    Please log in to view your payables.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full"></div>
                <p className="text-gray-500 text-sm mt-3">Loading payables...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <ExclamationCircleIcon className="w-10 h-10 text-red-500 mb-2" />
                <p className="text-red-600 font-semibold">{error}</p>
                <p className="text-gray-500 text-xs mt-1">Please try again later.</p>
            </div>
        );
    }

    if (!data || !data.details?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <CheckCircleIcon className="w-10 h-10 text-emerald-600 mb-2" />
                <p className="text-emerald-700 font-semibold">No Outstanding Payables</p>
                <p className="text-gray-500 text-xs">All payments are settled.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl shadow-sm border border-emerald-100 transition-all duration-500">

            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full text-left px-5 py-6 flex justify-between items-center rounded-t-2xl 
    border-b border-emerald-700 text-white transition-all duration-300
    bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600
    ${isExpanded ? "shadow-lg" : "shadow-md hover:brightness-110"}
  `}
            >
                {/* Left Side — Label + Amount */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FaMoneyBillWave className="text-white w-4 h-4 opacity-90" />
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-90">
                            Total Payables
                        </h3>
                    </div>
                    <p className="text-4xl font-extrabold text-white tabular-nums leading-none drop-shadow-sm">
                        {formatPHP(data.total)}
                    </p>
                    <p className="text-xs text-emerald-100 mt-1">
                        {data.details.length}{" "}
                        {data.details.length === 1 ? "unit" : "units"} with balance
                    </p>
                </div>

                {/* Right Side — Chevron Icon */}
                <div
                    className={`flex items-center transform transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : "rotate-0"
                    }`}
                >
                    <FaChevronDown className="w-5 h-5 text-white/90" />
                </div>
            </button>




            {/* Expandable Unit List */}
            <div
                className={`transition-all duration-500 overflow-hidden ${
                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="px-4 sm:px-6 pb-6 space-y-4 bg-white/60 backdrop-blur-sm rounded-b-2xl border-t border-emerald-100">
                    {data.details.map((unit) => (
                        <div
                            key={unit.unit_id}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <button
                                onClick={() =>
                                    setExpandedUnit(
                                        expandedUnit === unit.unit_id ? null : unit.unit_id
                                    )
                                }
                                className="w-full flex justify-between items-center p-4 sm:p-5 text-left"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 flex items-center justify-center rounded-lg shadow-sm">
                                        <FaHome className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                                            {unit.unit_name}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate">
                                            {unit.property_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-3">
                                    <p className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">
                                        {formatPHP(unit.total_due)}
                                    </p>
                                    {expandedUnit === unit.unit_id ? (
                                        <FaChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <FaChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                </div>
                            </button>

                            {/* Unit Billing Details */}
                            <div
                                className={`transition-all overflow-hidden ${
                                    expandedUnit === unit.unit_id
                                        ? "max-h-[800px] opacity-100"
                                        : "max-h-0 opacity-0"
                                }`}
                            >
                                <div className="p-4 sm:p-5 border-t border-emerald-100 bg-gradient-to-br from-gray-50 to-emerald-50 space-y-3 rounded-b-xl">
                                    {unit.billing_details?.length ? (
                                        unit.billing_details.map((bill) => (
                                            <div
                                                key={bill.billing_id}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-all"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 text-sm">
                                                        {formatDate(bill.billing_period)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Due: {formatDate(bill.due_date)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900 text-sm">
                                                            {formatPHP(bill.total_amount_due)}
                                                        </p>
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                                bill.status === "paid"
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : bill.status === "overdue"
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-amber-100 text-amber-700"
                                                            }`}
                                                        >
                              {bill.status.charAt(0).toUpperCase() +
                                  bill.status.slice(1)}
                            </span>
                                                    </div>

                                                    {bill.status !== "paid" && (
                                                        <button
                                                            onClick={() => handlePayNow(bill)}
                                                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm"
                                                        >
                                                            Pay
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-500 italic text-center py-2">
                                            No billing records available.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
