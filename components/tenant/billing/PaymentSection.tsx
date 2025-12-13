"use client";

import React from "react";
import { CreditCardIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

// With Xendit implementation, test environment first.


export default function PaymentSection({ bill, totalDue, agreement_id }) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loadingPayment, setLoadingPayment] = React.useState(false);

    /* -------------------- MAYA PAYMENT -------------------- */
    const handleXenditPayment = async () => {
        const confirm = await Swal.fire({
            title: "Pay via Xendit?",
            text: "This will redirect you to Xendit's secure checkout page.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Proceed",
        });

        if (!confirm.isConfirmed) return;

        setLoadingPayment(true);

        try {
            const formattedAmount = parseFloat(Number(totalDue).toFixed(2));

            const res = await axios.post("/api/tenant/billing/payment", {
                amount: formattedAmount,
                billing_id: bill.billing_id,
                tenant_id: user?.tenant_id,
                payment_method_id: 7,
                redirectUrl: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billFailed`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billCancelled`,
                },
            });

            if (res.data.checkoutUrl) {
                // Redirect tenant to Xendit invoice
                window.location.href = res.data.checkoutUrl;
            } else {
                Swal.fire("Error", "No checkout URL returned.", "error");
            }

        } catch (err) {
            Swal.fire("Error", "Failed to initiate Xendit payment.", "error");
        } finally {
            setLoadingPayment(false);
        }
    };

    /* -------------------- PROOF OF PAYMENT -------------------- */
    const handleUploadProof = () => {
        router.push(
            `/pages/payment/proofOfPayment?agreement_id=${agreement_id}&amountPaid=${totalDue}&billingId=${bill.billing_id}`
        );
    };

    return (
        <div className="p-4 border-t space-y-3">

            {/* Payment Buttons Only if Unpaid */}
            {bill.status !== "paid" && (
                <>
                    {/* Pay with Maya */}
                    <button
                        onClick={handleXenditPayment}
                        disabled={loadingPayment}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    >
                        {loadingPayment ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <CreditCardIcon className="w-5 h-5" />
                                <span>Pay with Maya</span>
                            </>
                        )}
                    </button>

                    {/* Upload Proof of Payment */}
                    <button
                        onClick={handleUploadProof}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 rounded-xl font-bold shadow-sm transition-all"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>Upload Proof of Payment</span>
                    </button>
                </>
            )}

            {/* Download Statement Button (Always Visible) */}
            {!bill.isDefaultBilling && (
                <button
                    onClick={() => window.open(`/api/tenant/billing/${bill.billing_id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 rounded-xl font-bold shadow-sm"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span>Download Billing PDF</span>
                </button>
            )}
        </div>
    );
}
