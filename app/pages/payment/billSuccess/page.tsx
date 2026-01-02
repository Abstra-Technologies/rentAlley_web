"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import html2canvas from "html2canvas";

/* -------------------------------------------------------------------------- */
/* Page Wrapper                                                                */
/* -------------------------------------------------------------------------- */
export default function SecSucceedPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
            <SecSuccess />
        </Suspense>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                              */
/* -------------------------------------------------------------------------- */
function SecSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const billing_id = searchParams.get("billing_id");
    const agreement_id = searchParams.get("agreement_id");
    const amount = searchParams.get("amount");
    const requestReferenceNumber =
        searchParams.get("requestReferenceNumber") ??
        (billing_id ? `billing-${billing_id}` : "");

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(
        "Confirming your payment. Please wait..."
    );
    const [status, setStatus] = useState<
        "success" | "pending" | "error" | null
    >(null);

    const receiptRef = useRef<HTMLDivElement>(null);

    /* ------------------------------------------------------------------------ */
    /* Fetch Payment Status (Webhook-first)                                     */
    /* ------------------------------------------------------------------------ */
    useEffect(() => {
        async function fetchStatus() {
            if (!billing_id) {
                setMessage("Invalid payment reference.");
                setStatus("error");
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(
                    `/api/tenant/payment/xendit/status?billing_id=${billing_id}`
                );

                if (res.data?.status === "paid") {
                    setStatus("success");
                    setMessage("Payment confirmed successfully.");
                } else {
                    setStatus("pending");
                    setMessage("Payment is still being processed.");
                }
            } catch (err) {
                console.error("Payment verification failed:", err);
                setStatus("error");
                setMessage("Unable to verify payment at this time.");
            } finally {
                setLoading(false);
            }
        }

        fetchStatus();
    }, [billing_id]);

    /* ------------------------------------------------------------------------ */
    /* Download Receipt                                                         */
    /* ------------------------------------------------------------------------ */
    const handleDownloadImage = async () => {
        if (!receiptRef.current) return;

        const canvas = await html2canvas(receiptRef.current, {
            scale: 3,
            backgroundColor: "#ffffff",
            useCORS: true,
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `UpKyp_Receipt_${requestReferenceNumber}.png`;
        link.click();
    };

    /* ------------------------------------------------------------------------ */
    /* UI                                                                        */
    /* ------------------------------------------------------------------------ */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
                {/* Status Icon */}
                <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full shadow-inner">
                    {loading && (
                        <div className="rounded-full bg-yellow-50 text-yellow-500 p-4">
                            <svg
                                className="animate-spin w-10 h-10"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="opacity-25"
                                />
                                <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                    className="opacity-75"
                                />
                            </svg>
                        </div>
                    )}

                    {!loading && status === "success" && (
                        <div className="rounded-full bg-green-50 text-green-600 p-4">
                            <svg
                                className="w-10 h-10"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    )}

                    {!loading && status === "error" && (
                        <div className="rounded-full bg-red-50 text-red-600 p-4">
                            <svg
                                className="w-10 h-10"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h2
                    className={`text-2xl font-extrabold mb-2 ${
                        status === "success"
                            ? "text-green-600"
                            : status === "error"
                                ? "text-red-600"
                                : "text-yellow-600"
                    }`}
                >
                    {loading
                        ? "Processing Payment"
                        : status === "success"
                            ? "Payment Successful"
                            : status === "error"
                                ? "Payment Error"
                                : "Payment Pending"}
                </h2>

                {/* Message */}
                <p className="text-gray-600 text-sm mb-6">{message}</p>

                {/* Receipt */}
                {status === "success" && (
                    <div
                        ref={receiptRef}
                        className="mt-4 text-left bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm"
                    >
                        <h2 className="text-center font-semibold">UpKyp Rent Systems</h2>
                        <h3 className="text-lg text-center font-bold text-gray-800 mb-3">
                            Payment Receipt
                        </h3>

                        <div className="space-y-2 text-sm text-gray-700">
                            <p>
                                <strong>Reference No:</strong>{" "}
                                <span>{requestReferenceNumber}</span>
                            </p>
                            <p>
                                <strong>Billing ID:</strong> <span>{billing_id}</span>
                            </p>
                            <p>
                                <strong>Date:</strong>{" "}
                                <span>{new Date().toLocaleString()}</span>
                            </p>
                            <p>
                                <strong>Amount Paid:</strong>{" "}
                                <span className="text-green-600 font-bold">
                  ₱
                                    {Number(amount ?? 0).toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                    })}
                </span>
                            </p>
                            <p>
                                <strong>Status:</strong>{" "}
                                <span className="text-green-600 font-semibold">Confirmed</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="my-6 border-t border-gray-200" />
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleDownloadImage}
                        disabled={status !== "success"}
                        className="px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Download Receipt
                    </button>

                    <button
                        onClick={() =>
                            router.replace(
                                agreement_id
                                    ? `/pages/tenant/billing?agreement_id=${agreement_id}`
                                    : "/pages/tenant/dashboard"
                            )
                        }
                        className="px-6 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow hover:from-blue-700 hover:to-emerald-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
