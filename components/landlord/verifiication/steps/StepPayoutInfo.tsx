"use client";

import { useEffect, useState } from "react";
import {
    FiCreditCard,
    FiInfo,
    FiAlertTriangle,
} from "react-icons/fi";
import axios from "axios";

type Bank = {
    name: string;
    code: string;
};

type Props = {
    landlordId: string;
    payoutMethod: string;
    setPayoutMethod: (v: string) => void;
    accountName: string;
    setAccountName: (v: string) => void;
    accountNumber: string;
    setAccountNumber: (v: string) => void;
    bankName: string;
    setBankName: (v: string) => void;
    onSaved?: () => void; // ✅ optional callback
};

export default function StepPayoutInfo({
                                           landlordId,
                                           payoutMethod,
                                           setPayoutMethod,
                                           accountName,
                                           setAccountName,
                                           accountNumber,
                                           setAccountNumber,
                                           bankName,
                                           setBankName,
                                           onSaved,
                                       }: Props) {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [showBanks, setShowBanks] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ================= LOAD EXISTING PAYOUT INFO ================= */
    useEffect(() => {
        if (!landlordId) return;

        async function loadExistingPayout() {
            try {
                const res = await axios.get(
                    `/api/landlord/payout/${landlordId}`
                );

                if (res.data) {
                    const data = res.data;
                    setPayoutMethod(data.payout_method || "");
                    setAccountName(data.account_name || "");
                    setAccountNumber(data.account_number || "");
                    setBankName(data.bank_name || "");
                }
            } catch (err: any) {
                if (err.response?.status !== 404) {
                    console.error("Failed to load payout info:", err);
                }
            } finally {
                setLoadingExisting(false);
            }
        }

        loadExistingPayout();
    }, [landlordId]);

    const filteredBanks = banks.filter((b) =>
        b.name.toLowerCase().includes(bankName.toLowerCase())
    );

    /* ================= BASIC VALIDATION ================= */
    const isValid =
        payoutMethod &&
        accountName &&
        accountNumber &&
        (payoutMethod !== "bank_transfer" || bankName);

    /* ================= SAVE HANDLER ================= */
    async function handleSave() {
        if (!isValid || saving) return;

        setSaving(true);
        setError(null);

        try {
            await axios.post("/api/landlord/payout/saveAccount", {
                landlord_id: landlordId,
                payout_method: payoutMethod,
                account_name: accountName,
                account_number: accountNumber,
                bank_name: payoutMethod === "bank_transfer" ? bankName : null,
            });

            onSaved?.();
        } catch (err) {
            console.error(err);
            setError("Failed to save payout information. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center mb-6">
                <FiCreditCard className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                    Payout Information
                </h2>
               Landlord ID:  {landlordId}
            </div>

            {loadingExisting && (
                <p className="text-sm text-gray-500">
                    Loading payout details…
                </p>
            )}

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

            {/* Info + Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start">
                    <FiInfo className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <p className="text-blue-700 text-sm">
                        Your payout details are required so Upkyp can securely send your
                        rental income.
                    </p>
                </div>

                <div className="flex items-start">
                    <FiAlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
                    <p className="text-orange-700 text-sm">
                        Please double-check that all information is correct. Incorrect
                        payout details may result in delayed or failed payments.
                    </p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={!isValid || saving}
                    className={`rounded-lg px-6 py-2 text-sm font-semibold text-white ${
                        !isValid || saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {saving ? "Saving..." : "Save Payout Info"}
                </button>
            </div>
        </section>
    );
}
