"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { XCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function PaymentFailedPage() {
    const params = useSearchParams();
    const router = useRouter();

    const agreement_id = params.get("agreement_id");

    const handleBack = () => router.back();

    return (
        <div className="min-h-screen p-6 text-center flex flex-col justify-center items-center">
            <XCircleIcon className="w-20 h-20 text-red-600 mb-4" />

            <h1 className="text-2xl font-bold text-red-700">Payment Failed</h1>

            <p className="text-gray-600 mt-2">
                Something went wrong. Your payment was not processed.
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
