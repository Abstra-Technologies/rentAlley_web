"use client";

import { X } from "lucide-react";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";

interface Props {
    open: boolean;
    onClose: () => void;

    payoutMethod: string;
    setPayoutMethod: (v: string) => void;
    accountName: string;
    setAccountName: (v: string) => void;
    accountNumber: string;
    setAccountNumber: (v: string) => void;
    bankName: string;
    setBankName: (v: string) => void;

    onSubmit: () => void;
}

export default function PayoutSetupModal({
                                             open,
                                             onClose,
                                             payoutMethod,
                                             setPayoutMethod,
                                             accountName,
                                             setAccountName,
                                             accountNumber,
                                             setAccountNumber,
                                             bankName,
                                             setBankName,
                                             onSubmit,
                                         }: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-800">
                        Set Up Payout Information
                    </h3>
                    <button onClick={onClose}>
                        <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <StepPayoutInfo
                        payoutMethod={payoutMethod}
                        setPayoutMethod={setPayoutMethod}
                        accountName={accountName}
                        setAccountName={setAccountName}
                        accountNumber={accountNumber}
                        setAccountNumber={setAccountNumber}
                        bankName={bankName}
                        setBankName={setBankName}
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSubmit}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Save Payout Info
                    </button>
                </div>
            </div>
        </div>
    );
}
