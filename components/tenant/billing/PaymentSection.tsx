"use client";

import React from "react";
import {
    CreditCardIcon,
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {useXenditPayment} from "@/hooks/payments/useXenditPayment";

export default function PaymentSection({ bill, totalDue, agreement_id }) {
    const router = useRouter();
    const { payWithXendit, loadingPayment } = useXenditPayment();

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
                    {/* Pay with Xendit */}
                    <button
                        onClick={() =>
                            payWithXendit({
                                billing_id: bill.billing_id,
                                amount: totalDue,
                            })
                        }
                        disabled={loadingPayment}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3
              bg-gradient-to-r from-blue-600 to-emerald-600
              hover:from-blue-700 hover:to-emerald-700
              text-white rounded-xl font-bold shadow-md
              hover:shadow-lg transition-all duration-200
              disabled:opacity-50"
                    >
                        {loadingPayment ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <CreditCardIcon className="w-5 h-5" />
                                <span>Pay Bill</span>
                            </>
                        )}
                    </button>

                    {/* Upload Proof */}
                    <button
                        onClick={handleUploadProof}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3
              bg-white border-2 border-gray-200
              hover:border-blue-300 hover:bg-blue-50
              text-gray-700 rounded-xl font-bold shadow-sm transition-all"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>Upload Proof of Payment</span>
                    </button>
                </>
            )}

            {/* Download Statement */}
            {!bill.isDefaultBilling && (
                <button
                    onClick={() =>
                        window.open(`/api/tenant/billing/${bill.billing_id}`)
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3
            bg-white border-2 border-gray-200
            hover:border-emerald-300 hover:bg-emerald-50
            text-gray-700 rounded-xl font-bold shadow-sm"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span>Download Billing PDF</span>
                </button>
            )}
        </div>
    );
}
