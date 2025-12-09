"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { XCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function PaymentFailedPage() {
    const params = useSearchParams();
    const router = useRouter();

    const agreement_id = params.get("agreement_id");
    const ref = params.get("ref");
    const payment_types = params.get("types");
    const totalAmount = params.get("totalAmount");

    // Prevent double API execution in React StrictMode
    const hasLogged = useRef(false);

    useEffect(() => {
        if (hasLogged.current) return;
        hasLogged.current = true;

        const logFailedPayment = async () => {
            try {
                await fetch("/api/tenant/initialPayment/recordPayment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        agreement_id,
                        ref,
                        payment_types,
                        totalAmount,
                        status: "failed",
                    }),
                });
            } catch (error) {
                console.error("Failed to log payment failure:", error);
            }
        };

        logFailedPayment();
    }, [agreement_id, ref, payment_types, totalAmount]);

    const handleBack = () => router.back();

    return (
        <div className="min-h-screen p-6 text-center flex flex-col justify-center items-center bg-gray-50">
            <XCircleIcon className="w-20 h-20 text-red-600 mb-4" />

            <h1 className="text-2xl font-bold text-red-700">Payment Failed</h1>

            <p className="text-gray-600 mt-2">
                The payment attempt for <b>Agreement #{agreement_id}</b> was not successful.
            </p>

            <p className="text-gray-500 text-sm mt-1">
                No charges were made. Please try again.
            </p>

            <button
                onClick={handleBack}
                className="mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-200"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Try Again
            </button>
        </div>
    );
}
