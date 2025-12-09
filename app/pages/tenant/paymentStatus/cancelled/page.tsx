"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ExclamationTriangleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function PaymentCancelledPage() {
    const params = useSearchParams();
    const router = useRouter();

    const agreement_id = params.get("agreement_id");
    const ref = params.get("ref");
    const payment_types = params.get("types");
    const totalAmount = params.get("totalAmount");

    // Send cancellation to backend
    useEffect(() => {
        const recordCancellation = async () => {
            try {
                await fetch("/api/tenant/initialPayment/cancelPayment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        agreement_id,
                        ref,
                        payment_types,
                        totalAmount,
                        status: "cancelled",
                    }),
                });
            } catch (error) {
                console.error("Error recording cancelled payment:", error);
            }
        };

        recordCancellation();
    }, []);

    const handleBack = () => router.back();

    return (
        <div className="min-h-screen p-6 text-center flex flex-col justify-center items-center bg-gray-50">
            <ExclamationTriangleIcon className="w-20 h-20 text-amber-500 mb-4" />

            <h1 className="text-2xl font-bold text-amber-600">Payment Cancelled</h1>

            <p className="text-gray-600 mt-2">
                Your payment process for <b>Agreement #{agreement_id}</b> was cancelled.
            </p>

            <p className="text-gray-500 mt-1 text-sm">
                No charges were made. Your balance remains unpaid.
            </p>

            <button
                onClick={handleBack}
                className="mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-200"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
            </button>
        </div>
    );
}
