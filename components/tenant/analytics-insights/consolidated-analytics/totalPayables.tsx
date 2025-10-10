"use client";
import { formatDate } from "@/utils/formatter/formatters";
import { useEffect, useState } from "react";
import { FaHome, FaMoneyBillWave, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useRouter } from "next/navigation";

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
    rent_amount: number | null;
    security_deposit_amount: number | null;
    advance_payment_amount: number | null;
    total_due: number | null;
    billing_details: BillingDetail[];
}

interface PayablesResponse {
    total: number;
    details: UnitPayable[];
}



export default function TenantPayables({ tenant_id }: { tenant_id: number | undefined }) {
    const [data, setData] = useState<PayablesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!tenant_id) return;

        setLoading(true);
        fetch(`/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`)
            .then((res) => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [tenant_id]);

    const formatPHP = (value: number | null | undefined): string =>
        `₱${(Number(value) || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const handlePayNow = (bill: BillingDetail) => {
        // For now, just log or redirect
        router.push(`/tenant/pay/${bill.billing_id}`);
    };

    if (!tenant_id) return <p className="text-gray-600 text-center">Please log in to view payables.</p>;
    if (loading) return <p className="text-center text-gray-500 animate-pulse">Loading payables...</p>;
    if (!data || !data.details?.length)
        return <p className="text-gray-500 text-center">No outstanding payables found.</p>;

    return (
        <div className="w-full space-y-6">
            {/* TOTAL SUMMARY */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg text-center text-white">
                <h2 className="text-lg font-medium tracking-wide">Total Payable</h2>
                <p className="text-4xl font-bold mt-1">{formatPHP(data.total)}</p>
            </div>

            <div className="space-y-4">
                {data.details.map((unit) => (
                    <div
                        key={unit.unit_id}
                        className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all"
                    >
                        {/* HEADER */}
                        <div
                            className="flex justify-between items-center p-4 cursor-pointer"
                            onClick={() => setExpandedUnit(expandedUnit === unit.unit_id ? null : unit.unit_id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg text-white shadow">
                                    <FaHome className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">
                                        {unit.unit_name} – {unit.property_name}
                                    </h3>

                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="text-sm font-semibold text-gray-800">{formatPHP(unit.total_due)}</p>
                                {expandedUnit === unit.unit_id ? (
                                    <FaChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <FaChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </div>
                        </div>

                        {/* EXPANDED BILLING DETAILS */}
                        {expandedUnit === unit.unit_id && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl animate-fadeIn">
                                {unit.billing_details?.length > 0 ? (
                                    <div className="space-y-2">
                                        {unit.billing_details.map((bill) => (
                                            <div
                                                key={bill.billing_id}
                                                className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        Monthly Billing:{" "}
                                                        <span className="text-gray-600">
      {formatDate(bill.billing_period)}
    </span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Due Date: {formatDate(bill.due_date)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {formatPHP(bill.total_amount_due)}
                                                    </p>
                                                    <span
                                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                            bill.status === "paid"
                                                                ? "bg-green-100 text-green-700"
                                                                : bill.status === "overdue"
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                            {bill.status.toUpperCase()}
                          </span>
                                                    {bill.status !== "paid" && (
                                                        <button
                                                            onClick={() => handlePayNow(bill)} // You’ll define this below
                                                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic text-center py-3">
                                        No billing records found for this unit.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
