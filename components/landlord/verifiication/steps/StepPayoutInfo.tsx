"use client";

import { useEffect, useState } from "react";
import {
    FiCreditCard,
    FiUser,
    FiPhone,
    FiBriefcase,
    FiInfo,
} from "react-icons/fi";
import axios from "axios";

type Bank = {
    name: string;
    code: string;
};

type Props = {
    payoutMethod: string;
    setPayoutMethod: (v: string) => void;
    accountName: string;
    setAccountName: (v: string) => void;
    accountNumber: string;
    setAccountNumber: (v: string) => void;
    bankName: string;
    setBankName: (v: string) => void;
};

export default function StepPayoutInfo({
                                           payoutMethod,
                                           setPayoutMethod,
                                           accountName,
                                           setAccountName,
                                           accountNumber,
                                           setAccountNumber,
                                           bankName,
                                           setBankName,
                                       }: Props) {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [showBanks, setShowBanks] = useState(false);

    /* ================= LOAD BANKS (SERVER) ================= */
    useEffect(() => {
        axios.get("/api/meta/ph-banks").then((res) => {
            setBanks(res.data || []);
        });
    }, []);

    const filteredBanks = banks.filter((b) =>
        b.name.toLowerCase().includes(bankName.toLowerCase())
    );

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center mb-6">
                <FiCreditCard className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                    Payout Information
                </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Payout Method */}
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Select Payout Method
                    </label>
                    <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                    >
                        <option value="">Choose payout method...</option>
                        <option value="gcash">GCash</option>
                        <option value="maya">Maya</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>

                {/* Account Name */}
                <div>
                    <label className="text-sm font-medium text-gray-700">
                        Account Name
                    </label>
                    <input
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                    />
                </div>

                {/* Account Number */}
                <div>
                    <label className="text-sm font-medium text-gray-700">
                        Account / Mobile Number
                    </label>
                    <input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                    />
                </div>

                {/* Bank Name */}
                {payoutMethod === "bank_transfer" && (
                    <div className="md:col-span-2 relative">
                        <label className="text-sm font-medium text-gray-700">
                            Bank Name
                        </label>

                        <input
                            value={bankName}
                            onChange={(e) => {
                                setBankName(e.target.value);
                                setShowBanks(true);
                            }}
                            onFocus={() => setShowBanks(true)}
                            onBlur={() => setTimeout(() => setShowBanks(false), 150)}
                            placeholder="Search or type bank name"
                            className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                        />

                        {showBanks && bankName && (
                            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border bg-white shadow">
                                {filteredBanks.slice(0, 8).map((bank) => (
                                    <li
                                        key={bank.code}
                                        onClick={() => {
                                            setBankName(bank.name);
                                            setShowBanks(false);
                                        }}
                                        className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                    >
                                        {bank.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                    <FiInfo className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <p className="text-blue-700 text-sm">
                        Your payout details are required so Upkyp can securely send your
                        rental income.
                    </p>
                </div>
            </div>
        </section>
    );
}
