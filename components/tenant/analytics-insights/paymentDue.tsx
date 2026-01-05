"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    ExclamationTriangleIcon,
    CreditCardIcon,
    ClockIcon, CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface BillingSummary {
    billing_id: string;
    total_due: number;
    days_late?: number;
}

interface PaymentDueWidgetProps {
    agreement_id: string;
}

export default function PaymentDueWidget({
                                             agreement_id,
                                         }: PaymentDueWidgetProps) {
    const [billing, setBilling] = useState<BillingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!agreement_id) {
            setLoading(false);
            return;
        }

        let active = true;

        async function fetchBilling() {
            try {
                const res = await axios.get(
                    "/api/tenant/dashboard/getPaymentDue",
                    { params: { agreement_id } }
                );

                if (active) setBilling(res.data.billing);
            } catch {
                console.error("Failed to fetch payment due");
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchBilling();
        return () => {
            active = false;
        };
    }, [agreement_id]);

    /* ---------- LOADING ---------- */
    if (loading) return null;

    /* ---------- NO DUE ---------- */
    if (!billing || billing.total_due <= 0) {
        return (
            <div
                className="
        bg-emerald-50 border border-emerald-200
        rounded-2xl p-5
        shadow-sm
      "
            >
                <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-100 rounded-xl">
                        <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-900">
                            No Payment Due
                        </p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                            You’re all caught up. No outstanding bills at the moment.
                        </p>
                    </div>
                </div>

                <div className="mt-3 bg-white border border-emerald-200 rounded-xl p-3">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                        Status
                    </p>
                    <p className="text-sm font-semibold text-emerald-600">
                        Account in good standing
                    </p>
                </div>
            </div>
        );
    }

    const daysLate = billing.days_late ?? 0;

    return (
        <div
            className="
        relative
        bg-gradient-to-br from-red-50 to-orange-50
        border border-red-200
        rounded-2xl
        p-5
        shadow-sm
      "
        >
            {/* ---------- Header ---------- */}
            <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-100 rounded-xl">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>

                <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">
                        Pending Payments
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                        Billing ID:{" "}
                        <span className="font-mono font-semibold">
              {billing.billing_id}
            </span>
                    </p>
                </div>
            </div>

            {/* ---------- Amount + Days Late ---------- */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white border border-red-200 rounded-xl p-3">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                        Amount Due
                    </p>
                    <p className="text-xl font-extrabold text-red-600">
                        ₱{billing.total_due.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white border border-orange-200 rounded-xl p-3">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                        Days Late
                    </p>
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4 text-orange-500" />
                        <p className="text-xl font-extrabold text-orange-600">
                            {daysLate}
                        </p>
                    </div>
                </div>
            </div>

            {/* ---------- CTA ---------- */}
            <button
                onClick={() =>
                    router.push(
                        `/pages/tenant/rentalPortal/${agreement_id}/billing?billing_id=${billing.billing_id}`
                    )
                }
                className="
          mt-4 w-full
          flex items-center justify-center gap-2
          bg-red-600 hover:bg-red-700
          text-white
          font-semibold text-sm
          py-3 rounded-xl
          transition
        "
            >
                <CreditCardIcon className="w-5 h-5" />
                Pay Now
            </button>

            {/* ---------- Subtle Warning ---------- */}
            <p className="mt-2 text-[11px] text-red-700 text-center">
                Please settle this bill to avoid penalties or service interruption.
            </p>
        </div>
    );
}
