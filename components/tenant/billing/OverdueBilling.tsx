"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    formatDate,
    formatCurrency,
} from "@/utils/formatter/formatters";
import {
    ExclamationTriangleIcon,
    CreditCardIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useXenditPayment } from "@/hooks/payments/useXenditPayment";

/* --------------------------------
   TYPES
-------------------------------- */
interface OverdueBill {
    billing_id: string;
    billing_period: string;
    due_date: string;
    total_amount_due: number | string;

    // backend meaning
    days_overdue: number;        // post-grace (billable)
    grace_period_days: number;  // grace period
}

/* --------------------------------
   COMPONENT
-------------------------------- */
export default function OverdueBilling({
                                           agreement_id,
                                           user_id,
                                       }: {
    agreement_id?: string;
    user_id?: string;
}) {
    const [bills, setBills] = useState<OverdueBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const { payWithXendit, loadingPayment } = useXenditPayment();

    /* --------------------------------
       FETCH OVERDUE BILLS
    -------------------------------- */
    useEffect(() => {
        if (!user_id) {
            setLoading(false);
            return;
        }

        const fetchOverdue = async () => {
            try {
                const params: any = { user_id };
                if (agreement_id) params.agreement_id = agreement_id;

                const res = await axios.get(
                    "/api/tenant/billing/overdue",
                    { params }
                );

                setBills(res.data.bills || []);
            } catch (err) {
                console.error("Failed to load overdue bills", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOverdue();
    }, [agreement_id, user_id]);

    /* --------------------------------
       HELPERS
    -------------------------------- */
    const totalDaysSinceDue = (bill: OverdueBill) =>
        Math.max(bill.days_overdue + bill.grace_period_days, 0);

    /* --------------------------------
       PDF DOWNLOAD
    -------------------------------- */
    const handleDownload = async (billing_id: string) => {
        setDownloadingId(billing_id);
        try {
            const res = await axios.get(
                `/api/tenant/billing/${billing_id}`,
                { responseType: "blob" }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Billing_${billing_id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to generate billing PDF:", err);
            alert("Failed to generate billing PDF.");
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading || !bills.length) return null;

    /* --------------------------------
       RENDER
    -------------------------------- */
    return (
        <div className="mb-8">
            {/* HEADER */}
            <div className="mb-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-red-700">
                        Overdue Bills
                    </h2>
                    <p className="text-xs text-gray-600">
                        Immediate payment required
                    </p>
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-4">
                {bills.map((bill) => {
                    const totalLate = totalDaysSinceDue(bill);

                    return (
                        <div
                            key={bill.billing_id}
                            className="bg-white border border-red-200 rounded-xl p-4 shadow-sm"
                        >
                            {/* TOP */}
                            <div className="flex justify-between items-start gap-3">
                                {/* LEFT */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {formatDate(bill.billing_period)}
                                    </p>

                                    <p className="text-xs text-red-600 font-medium">
                                        Due {formatDate(bill.due_date)} ·{" "}
                                        {bill.days_overdue} day{totalLate !== 1 && "s"} overdue
                                    </p>

                                    {/* Clarification */}
                                    <div className="mt-1 space-y-0.5">
                                        {bill.grace_period_days > 0 && (
                                            <p className="text-[10px] text-gray-500">
                                                Includes {bill.grace_period_days}-day grace period
                                            </p>
                                        )}

                                    </div>
                                </div>

                                {/* RIGHT */}
                                <div className="text-right">
                                    <p className="text-sm font-bold text-red-700">
                                        {formatCurrency(bill.total_amount_due)}
                                    </p>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="mt-4 flex gap-2">
                                {/* PAY NOW */}
                                <button
                                    onClick={() =>
                                        payWithXendit({
                                            billing_id: bill.billing_id,
                                            amount: bill.total_amount_due,
                                        })
                                    }
                                    disabled={loadingPayment}
                                    className="
                    flex-1 flex items-center justify-center gap-1
                    bg-red-600 hover:bg-red-700
                    text-white text-xs font-semibold
                    py-2 rounded-lg
                    disabled:opacity-50
                  "
                                >
                                    {loadingPayment ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCardIcon className="w-4 h-4" />
                                            Pay Now
                                        </>
                                    )}
                                </button>

                                {/* DOWNLOAD PDF */}
                                <button
                                    onClick={() => handleDownload(bill.billing_id)}
                                    disabled={downloadingId === bill.billing_id}
                                    className="
                    px-3 py-2 rounded-lg border
                    text-xs font-semibold text-gray-700
                    hover:bg-gray-50
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                                >
                                    {downloadingId === bill.billing_id ? (
                                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
