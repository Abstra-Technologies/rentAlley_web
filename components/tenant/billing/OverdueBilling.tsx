"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDate } from "@/utils/formatter/formatters";
import {
    ExclamationTriangleIcon,
    CreditCardIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface OverdueBill {
    billing_id: string;
    billing_period: string;
    due_date: string;
    total_amount_due: number;
    days_overdue: number;
}

export default function OverdueBilling({
                                           agreement_id,
                                           user_id,
                                       }: {
    agreement_id?: string;
    user_id?: string;
}) {
    const [bills, setBills] = useState<OverdueBill[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
                console.error("Failed to load overdue bills");
            } finally {
                setLoading(false);
            }
        };

        fetchOverdue();
    }, [agreement_id, user_id]);

    if (loading) return null;
    if (!bills.length) return null;

    return (
        <div className="mb-8">
            {/* Header */}
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

            {/* List */}
            <div className="space-y-3">
                {bills.map((bill) => (
                    <div
                        key={bill.billing_id}
                        className="bg-white border border-red-200 rounded-xl p-4 shadow-sm"
                    >
                        <div className="flex justify-between items-start gap-3">
                            {/* Left */}
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {formatDate(bill.billing_period)}
                                </p>
                                <p className="text-xs text-red-600">
                                    Due {formatDate(bill.due_date)} ·{" "}
                                    {bill.days_overdue} day
                                    {bill.days_overdue > 1 && "s"} overdue
                                </p>
                            </div>

                            {/* Right */}
                            <div className="text-right">
                                <p className="text-sm font-bold text-red-700">
                                    ₱{bill.total_amount_due.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={() =>
                                    router.push(
                                        `/pages/tenant/pay/${bill.billing_id}`
                                    )
                                }
                                className="flex-1 flex items-center justify-center gap-1
                  bg-red-600 hover:bg-red-700
                  text-white text-xs font-semibold
                  py-2 rounded-lg"
                            >
                                <CreditCardIcon className="w-4 h-4" />
                                Pay Now
                            </button>

                            <button
                                onClick={() =>
                                    window.open(
                                        `/api/tenant/billing/pdf/${bill.billing_id}`,
                                        "_blank"
                                    )
                                }
                                className="px-3 py-2 rounded-lg border
                  text-xs font-semibold text-gray-700
                  hover:bg-gray-50"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
