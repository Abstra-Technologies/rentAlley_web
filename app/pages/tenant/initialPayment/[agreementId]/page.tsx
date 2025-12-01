"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

import {
    ArrowLeftIcon,
    PhotoIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

import LoadingScreen from "@/components/loadingScreen";

export default function InitialPaymentPage({
                                               params,
                                           }: {
    params: { agreementId: string };
}) {
    const router = useRouter();
    const agreementId = params.agreementId;

    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const { user, fetchSession } = useAuthStore();


    /* -----------------------------------------
       FETCH PAYMENT DETAILS
    ----------------------------------------- */
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(
                `/api/tenant/initialPayment/details?agreement_id=${agreementId}`
            );
            setPaymentData(res.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load details");
        } finally {
            setLoading(false);
        }
    }, [agreementId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const goBack = () => router.back();

    /* -----------------------------------------
       UPLOAD PROOF HANDLER
       - sends payment_type: 'advance' | 'deposit'
    ----------------------------------------- */
    const handleUploadProof = async (type: "advance" | "deposit") => {
        const { value: file } = await Swal.fire({
            title: `Upload Proof of ${type === "advance" ? "Advance Payment" : "Security Deposit"}`,
            input: "file",
            inputAttributes: {
                accept: "image/*,application/pdf",
            },
            showCancelButton: true,
        });

        if (!file) return;

        setIsUploading(true);
        Swal.fire({
            title: "Uploading...",
            text: "Please wait",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("agreement_id", agreementId);
            formData.append("payment_type", type);

            await axios.post("/api/tenant/initialPayment/uploadProof", formData);

            Swal.close();
            Swal.fire("Success", "Proof uploaded successfully!", "success");
            await fetchData();
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.message || "Upload failed", "error");
        } finally {
            setIsUploading(false);
        }
    };

    /* -----------------------------------------
       PAY BUTTON HANDLER
       - pushes to a payment page (replace with real integration)
    ----------------------------------------- */
    const handlePay = async (type: "advance" | "deposit") => {
        try {
            setIsRedirecting(true);

            const payload = {
                agreement_id: agreementId,
                payment_method_id: "paymaya",
                items: [
                    {
                        type: type === "advance" ? "advance_payment" : "security_deposit",
                        amount:
                            type === "advance"
                                ? data.advance_payment.amount
                                : data.security_deposit.amount,
                    },
                ],
                firstName: user?.firstName,
                lastName: user?.lastName,
                email: user?.email,
                redirectUrl: {
                    success: `${window.location.origin}/pages/tenant/paymentStatus/success`,
                    failure: `${window.location.origin}/pages/tenant/paymentStatus/failed`,
                    cancel: `${window.location.origin}/pages/tenant/paymentStatus/cancelled`,
                },
            };

            const res = await axios.post("/api/tenant/initialPayment", payload);

            if (res.data.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            } else {
                Swal.fire("Error", "Failed to initialize PayMaya checkout.", "error");
            }
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.message || "Payment failed", "error");
        } finally {
            setIsRedirecting(false);
        }
    };

    if (loading) return <LoadingScreen message="Loading payment details..." />;

    if (error)
        return (
            <div className="p-6 text-center text-red-600 font-semibold">
                <p>{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );

    const data = paymentData ?? {};

    /* -------------------------------------------------
       Determine which items are still unpaid
       - We do NOT combine items. If both pending: show only FIRST (advance)
       - After that one is completed (upload/proceed), fetchData will refresh and show next.
    ------------------------------------------------- */
    const advance = data.advance_payment ?? null;
    const deposit = data.security_deposit ?? null;

    const hasAdvance = !!advance && advance.status !== "paid";
    const hasDeposit = !!deposit && deposit.status !== "paid";

    // Priority: advance first, then deposit
    const firstPending = hasAdvance ? "advance" : hasDeposit ? "deposit" : null;
    const secondPending =
        hasAdvance && hasDeposit ? (firstPending === "advance" ? "deposit" : "advance") : null;

    const advanceAmount = advance ? Number(advance.amount || 0) : 0;
    const depositAmount = deposit ? Number(deposit.amount || 0) : 0;

    const totalDue = (hasAdvance ? advanceAmount : 0) + (hasDeposit ? depositAmount : 0);

    /* Responsive spacing: buttons are full width on mobile, grouped on larger screens */
    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={goBack}
                    aria-label="Go back"
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 truncate">
                    Initial Payment — Agreement #{agreementId}
                </h1>
            </div>

            {/* SUMMARY */}
            <div className="bg-white border rounded-xl shadow-sm p-4 mb-6">
                <h2 className="font-semibold text-gray-800 mb-3">Initial Payment Overview</h2>

                {totalDue > 0 ? (
                    <div className="text-sm space-y-2">
                        {hasAdvance && (
                            <div className="flex justify-between">
                                <span className="truncate">Advance Payment</span>
                                <span className="font-bold text-blue-700">₱{advanceAmount.toLocaleString()}</span>
                            </div>
                        )}

                        {hasDeposit && (
                            <div className="flex justify-between">
                                <span className="truncate">Security Deposit</span>
                                <span className="font-bold text-blue-700">₱{depositAmount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between pt-2 border-t font-bold text-lg">
                            <span>Total Due</span>
                            <span>₱{totalDue.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Payments must be made step-by-step. Complete the first pending item, then the next will appear.
                        </p>
                    </div>
                ) : (
                    <p className="text-emerald-600 font-semibold">Your initial payments are fully settled.</p>
                )}
            </div>

            {/* FIRST PENDING ITEM */}
            {firstPending === "advance" && hasAdvance && (
                <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                        Advance Payment (₱{advanceAmount.toLocaleString()})
                    </h3>

                    <div className="space-y-3">
                        <button
                            onClick={() => handlePay("advance")}
                            disabled={isUploading || isRedirecting}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                            Pay via PayMaya
                        </button>

                        <button
                            onClick={() => handleUploadProof("advance")}
                            disabled={isUploading || isRedirecting}
                            className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <PhotoIcon className="w-5 h-5" />
                            Upload Proof of Advance Payment
                        </button>
                    </div>
                </div>
            )}

            {firstPending === "deposit" && hasDeposit && (
                <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                        Security Deposit (₱{depositAmount.toLocaleString()})
                    </h3>

                    <div className="space-y-3">
                        <button
                            onClick={() => handlePay("deposit")}
                            disabled={isUploading || isRedirecting}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                            Pay via PayMaya
                        </button>

                        <button
                            onClick={() => handleUploadProof("deposit")}
                            disabled={isUploading || isRedirecting}
                            className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <PhotoIcon className="w-5 h-5" />
                            Upload Proof of Security Deposit
                        </button>
                    </div>
                </div>
            )}

            {/* SECOND item hint (visible only after first is cleared by refetch) */}
            {secondPending && (
                <div className="bg-white border rounded-xl shadow-sm p-3 mb-4">
                    <p className="text-sm text-gray-600">
                        After you complete the first payment, the next payment ({secondPending === "advance" ? "Advance Payment" : "Security Deposit"}) will become available here.
                    </p>
                </div>
            )}

            {/* COMPLETE MESSAGE */}
            {totalDue <= 0 && (
                <div className="mt-6 p-4 text-center bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 mx-auto mb-2" />
                    Your initial payments are complete.
                    <br />
                    You may now access your tenant portal anytime.
                </div>
            )}
        </div>
    );
}
