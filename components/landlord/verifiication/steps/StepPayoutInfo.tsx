"use client";

import { useEffect, useState } from "react";
import {
    FiCreditCard,
    FiInfo,
    FiAlertTriangle,
    FiSearch,
} from "react-icons/fi";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

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
    const { user, loading, fetchSession } = useAuthStore();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ================= LOAD CHANNELS ================= */
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

    const filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(methodSearch.toLowerCase())
    );

    const isValid = payoutMethod && accountName && accountNumber;

    /* ================= SAVE ================= */
    async function handleSave() {
        if (!isValid || saving) return;

        setSaving(true);
        setError(null);

        const selectedChannel = channels.find(
            (c) => c.code === payoutMethod
        );

        try {
            await axios.post("/api/landlord/payout/saveAccount", {
                landlord_id: landlordId,
                business_email:user?.email,
                channel_code: payoutMethod,
                bank_name: selectedChannel?.name || null,
                account_name: accountName,
                account_number: accountNumber,
            });

            onSaved?.();
        } catch (err) {
            console.error(err);
            setError("Unable to save payout information. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    /* ================= UI ================= */
    return (
        <section className="space-y-8">

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                    <FiCreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Set Up Payout
                    </h2>
                    <p className="text-sm text-gray-500">
                        Connect your bank or e-wallet to receive rental income.
                    </p>
                </div>
            </div>

            {/* Method Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                        Payout Partner
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowPartnersModal(true)}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        View all
                    </button>
                </div>

                <div className="relative">
                    <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                        value={methodSearch}
                        onChange={(e) => {
                            setMethodSearch(e.target.value);
                            setShowMethods(true);
                        }}
                        placeholder="Search bank or e-wallet"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {showMethods && methodSearch && (
                        <ul className="absolute z-20 mt-2 w-full max-h-52 overflow-auto rounded-xl border bg-white shadow-lg">
                            {filteredChannels.map((channel) => (
                                <li
                                    key={channel.code}
                                    onClick={() => {
                                        setPayoutMethod(channel.code);
                                        setMethodSearch(channel.name);
                                        setBankName(channel.name);
                                        setShowMethods(false);
                                    }}
                                    className="px-4 py-3 text-sm cursor-pointer hover:bg-blue-50"
                                >
                                    <div className="flex justify-between">
                                        <span>{channel.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {channel.type}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Account Inputs */}
            <div className="space-y-5">
                <div>
                    <label className="text-sm font-medium text-gray-700">
                        Account Name
                    </label>
                    <input
                        value={accountName}
                        onChange={(e) =>
                            setAccountName(e.target.value)
                        }
                        placeholder="Full name on account"
                        className="w-full mt-1 px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">
                        Account / Mobile Number
                    </label>
                    <input
                        value={accountNumber}
                        onChange={(e) =>
                            setAccountNumber(e.target.value)
                        }
                        placeholder="Enter account number"
                        className="w-full mt-1 px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Info Box */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 space-y-3">
                <div className="flex items-start gap-3">
                    <FiInfo className="mt-1" />
                    <p>
                        Double-check your payout details. Incorrect
                        information may delay transfers.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <FiAlertTriangle className="mt-1 text-orange-500" />
                    <p>
                        Ensure the account name matches your
                        verification details.
                    </p>
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Sticky Save Button */}
            <div className="pt-4">
                <button
                    onClick={handleSave}
                    disabled={!isValid || saving}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-white transition ${
                        !isValid || saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {saving ? "Saving..." : "Save Payout Information"}
                </button>
            </div>

            {/* Partners Modal */}
            {showPartnersModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
                    <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">

                        <div className="px-6 py-4 border-b">
                            <h3 className="font-bold text-gray-800">
                                Available Payout Partners
                            </h3>
                        </div>

                        <div className="px-6 py-4 space-y-2">
                            {channels.map((c) => (
                                <div
                                    key={c.code}
                                    className="text-sm text-gray-600 py-2 border-b last:border-none"
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end">
                            <button
                                onClick={() =>
                                    setShowPartnersModal(false)
                                }
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
