"use client";

import { FiCreditCard, FiUser, FiPhone, FiBriefcase, FiInfo } from "react-icons/fi";

export default function StepPayoutInfo(props: any) {
    const {
        payoutMethod,
        setPayoutMethod,
        accountName,
        setAccountName,
        accountNumber,
        setAccountNumber,
        bankName,
        setBankName,
    } = props;

    return (
        <section className="space-y-6">
            <div className="flex items-center mb-6">
                <FiCreditCard className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Payout Information</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiCreditCard className="w-4 h-4 mr-2 text-gray-400" />
                        Select Payout Method
                    </label>
                    <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                    >
                        <option value="">Choose payout method...</option>
                        <option value="gcash">GCash</option>
                        <option value="maya">Maya</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                        Account Name
                    </label>
                    <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                    />
                </div>

                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                        Account / Mobile Number
                    </label>
                    <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                    />
                </div>

                {payoutMethod === "bank_transfer" && (
                    <div className="md:col-span-2 space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                            Bank Name
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        />
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                    <FiInfo className="w-5 h-5 text-blue-600 mr-3" />
                    <p className="text-blue-700 text-sm">
                        Your payout details are required so Upkyp can send your rental income securely.
                    </p>
                </div>
            </div>
        </section>
    );
}
