"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import * as htmlToImage from "html-to-image";

import {
    CheckCircleIcon,
    ArrowLeftIcon,
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

export default function PaymentSuccessPage() {
    const params = useSearchParams();
    const router = useRouter();

    const agreement_id = params.get("agreement_id");
    const ref = params.get("ref");
    const payment_types = params.get("types");
    const totalAmount = params.get("totalAmount");

    const receiptRef = useRef<HTMLDivElement>(null);

    // Prevent double execution (Next.js strict mode)
    const hasRecorded = useRef(false);

    useEffect(() => {
        if (hasRecorded.current) return;
        hasRecorded.current = true;

        const recordPayment = async () => {
            try {
                // Avoid sending empty data
                if (!agreement_id || !ref) return;

                await fetch("/api/tenant/initialPayment/recordPayment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        agreement_id,
                        ref,
                        payment_types,
                        totalAmount,
                        status: "success",
                    }),
                });
            } catch (error) {
                console.error("Error saving payment:", error);
            }
        };

        recordPayment();
    }, [agreement_id, ref, payment_types, totalAmount]);

    const downloadPNG = async () => {
        if (!receiptRef.current) return;

        try {
            const dataUrl = await htmlToImage.toPng(receiptRef.current, {
                cacheBust: true,
                pixelRatio: 2, // high resolution
            });

            const link = document.createElement("a");
            link.download = `Receipt-${agreement_id}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("PNG Generation Error:", error);
        }
    };

    return (
        <div className="min-h-screen p-6 flex flex-col items-center text-center bg-gray-50">

            {/* SUCCESS ICON */}
            <CheckCircleIcon className="w-20 h-20 text-emerald-600 mb-4" />

            <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-600 mt-2">
                Payment for <b>Agreement #{agreement_id}</b> has been confirmed.
            </p>

            {/* RECEIPT BLOCK */}
            <div
                ref={receiptRef}
                className="mt-6 bg-white border rounded-xl shadow-sm p-4 w-full max-w-md"
            >
                <h2 className="font-semibold text-gray-800 mb-3 text-left">
                    Payment Receipt
                </h2>

                <div className="space-y-2 text-sm text-left">
                    <p><strong>Agreement ID:</strong> {agreement_id}</p>
                    <p><strong>Reference #:</strong> {ref}</p>
                    <p><strong>Payment Types:</strong> {payment_types?.replace(/,/g, ", ")}</p>
                    <p><strong>Total Paid:</strong> ₱{totalAmount}</p>
                    <p><strong>Status:</strong> Success</p>
                    <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                </div>
            </div>

            {/* DOWNLOAD RECEIPT */}
            <button
                onClick={downloadPNG}
                className="mt-5 w-full max-w-md py-3 bg-emerald-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700"
            >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Download Receipt (PNG)
            </button>

            {/* BACK BUTTON */}
            <button
                onClick={() => router.push(`/pages/tenant/initialPayment/${agreement_id}`)}
                className="mt-4 w-full max-w-md py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Payments
            </button>
        </div>
    );
}
