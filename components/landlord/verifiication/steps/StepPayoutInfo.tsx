"use client";

import { useEffect, useState } from "react";
import {
    FiCreditCard,
    FiInfo,
    FiAlertTriangle,
} from "react-icons/fi";
import axios from "axios";

type Channel = {
    name: string;
    code: string;
    type: "BANK" | "EWALLET";
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
    onSaved?: () => void;
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
    const [channels, setChannels] = useState<Channel[]>([]);
    const [methodSearch, setMethodSearch] = useState("");
    const [showMethods, setShowMethods] = useState(false);
    const [showPartnersModal, setShowPartnersModal] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ================= LOAD PAYOUT CHANNELS ================= */
    useEffect(() => {
        async function loadChannels() {
            try {
                const res = await axios.get("/api/payment/payoutChannels");
                setChannels(res.data || []);
            } catch (err) {
                console.error("Failed to load payout channels:", err);
            }
        }
        loadChannels();
    }, []);

    /* ================= FILTER (SEARCH ONLY) ================= */
    const filteredChannels = channels.filter(c =>
        c.name.toLowerCase().includes(methodSearch.toLowerCase())
    );

    /* ================= VALIDATION ================= */
    const isValid =
        payoutMethod &&
        accountName &&
        accountNumber;

    /* ================= SAVE ================= */
    async function handleSave() {
        if (!isValid || saving) return;

        setSaving(true);
        setError(null);

        const selectedChannel = channels.find(c => c.code === payoutMethod);

        try {
            await axios.post("/api/landlord/payout/saveAccount", {
                landlord_id: landlordId,

                // NEW: canonical identifier
                channel_code: payoutMethod,

                // still useful for UI / reporting
                bank_name: selectedChannel?.name || null,

                account_name: accountName,
                account_number: accountNumber,
            });

            onSaved?.();
        } catch (err) {
            console.error(err);
            setError("Failed to save payout information.");
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
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Searchable Payout Channel */}
                <div className="md:col-span-2 relative">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            Search Payout Method
                        </label>

                        <button
                            type="button"
                            onClick={() => setShowPartnersModal(true)}
                            className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                            View available partners
                        </button>
                    </div>

                    <input
                        value={methodSearch}
                        onChange={(e) => {
                            setMethodSearch(e.target.value);
                            setShowMethods(true);
                        }}
                        onFocus={() => setShowMethods(true)}
                        onBlur={() => setTimeout(() => setShowMethods(false), 150)}
                        placeholder="Search payout partner"
                        className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                    />

                    {showMethods && methodSearch && (
                        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border bg-white shadow">
                            {filteredChannels.map(channel => (
                                <li
                                    key={channel.code}
                                    onClick={() => {
                                        setPayoutMethod(channel.code);
                                        setMethodSearch(channel.name);
                                        setBankName(channel.name);
                                        setShowMethods(false);
                                    }}
                                    className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                >
                                    {channel.name}
                                    <span className="ml-2 text-xs text-gray-400">
                    ({channel.type})
                  </span>
                                </li>
                            ))}
                        </ul>
                    )}
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
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start">
                    <FiInfo className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <p className="text-blue-700 text-sm">
                        Your payout details are required so Upkyp can securely send your rental income.
                    </p>
                </div>

                <div className="flex items-start">
                    <FiAlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
                    <p className="text-orange-700 text-sm">
                        Please double-check all details to avoid payout delays.
                    </p>
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

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

            {/* Partners Modal */}
            {showPartnersModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-bold text-gray-800">
                                Available Payout Partners
                            </h3>
                            <button
                                onClick={() => setShowPartnersModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                            <ul className="space-y-1">
                                {channels.map(c => (
                                    <li key={c.code} className="text-sm text-gray-600">
                                        • {c.name}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowPartnersModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
