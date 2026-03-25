"use client";

import { useEffect, useState, useRef } from "react";
import {
    FiCreditCard,
    FiAlertTriangle,
    FiSearch,
    FiX,
} from "react-icons/fi";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

type Channel = {
    name: string;
    code: string;
    type: "BANK" | "EWALLET";
};

type CountryCode = {
    code: string;
    name: string;
    flag: string;
};

const COUNTRY_CODES: CountryCode[] = [
    { code: "+63", name: "Philippines", flag: "🇵🇭" },
    { code: "+1", name: "US/Canada", flag: "🇺🇸" },
    { code: "+44", name: "UK", flag: "🇬🇧" },
    { code: "+62", name: "Indonesia", flag: "🇮🇩" },
    { code: "+66", name: "Thailand", flag: "🇹🇭" },
    { code: "+60", name: "Malaysia", flag: "🇲🇾" },
    { code: "+65", name: "Singapore", flag: "🇸🇬" },
    { code: "+84", name: "Vietnam", flag: "🇻🇳" },
];

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
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(COUNTRY_CODES[0]);
    const { user } = useAuthStore();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

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

    /* ================= CLICK OUTSIDE ================= */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCountryDropdown(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowMethods(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(methodSearch.toLowerCase())
    );

    const selectedChannel = channels.find(c => c.code === payoutMethod);
    const isEwallet = selectedChannel?.type === "EWALLET";
    
    const isValid = payoutMethod && accountName && accountNumber;

    /* ================= SAVE ================= */
    async function handleSave() {
        if (!isValid || saving) return;

        setSaving(true);
        setError(null);

        try {
            const finalAccountNumber = isEwallet 
                ? `${selectedCountryCode.code}${accountNumber.replace(/^0/, '')}`
                : accountNumber;

            await axios.post("/api/landlord/payout/saveAccount", {
                landlord_id: landlordId,
                business_email: user?.email,
                channel_code: payoutMethod,
                bank_name: selectedChannel?.name || null,
                account_name: accountName,
                account_number: finalAccountNumber,
            });

            onSaved?.();
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 409) {
                setError("Payout account already exists.");
            } else {
                setError("Unable to save. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    /* ================= UI ================= */
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiCreditCard className="w-5 h-5 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-900">Set Up Payout</h2>
                    <p className="text-xs text-gray-500">Connect your bank or e-wallet</p>
                </div>
            </div>

            {/* Method Selection */}
            <div className="relative" ref={searchRef}>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Payout Partner</label>
                    <button
                        type="button"
                        onClick={() => setShowPartnersModal(true)}
                        className="text-[10px] text-blue-600 font-medium hover:underline"
                    >
                        View all
                    </button>
                </div>

                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        value={methodSearch}
                        onChange={(e) => {
                            setMethodSearch(e.target.value);
                            setShowMethods(true);
                        }}
                        onFocus={() => setShowMethods(true)}
                        placeholder="Search bank or e-wallet..."
                        className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-sm"
                    />
                    {methodSearch && (
                        <button
                            onClick={() => { setMethodSearch(""); setShowMethods(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            <FiX className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {showMethods && methodSearch && (
                        <ul className="absolute z-30 mt-1 w-full max-h-36 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                            {filteredChannels.length === 0 ? (
                                <li className="px-3 py-2 text-xs text-gray-500 text-center">No results</li>
                            ) : (
                                filteredChannels.map((channel) => (
                                    <li
                                        key={channel.code}
                                        onClick={() => {
                                            setPayoutMethod(channel.code);
                                            setMethodSearch(channel.name);
                                            setBankName(channel.name);
                                            setShowMethods(false);
                                        }}
                                        className="px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between"
                                    >
                                        <span className="font-medium text-gray-800">{channel.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                            channel.type === "BANK" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                                        }`}>
                                            {channel.type}
                                        </span>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* Account Name */}
            <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Account Name</label>
                <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Full name on account"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:ring-1.5 focus:ring-blue-500 text-sm"
                />
            </div>

            {/* Account Number / Mobile */}
            <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    {isEwallet ? "Mobile Number" : "Account Number"}
                </label>
                
                {isEwallet ? (
                    <div className="flex gap-1.5">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                className="flex items-center gap-1 px-2.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 min-w-[75px]"
                            >
                                <span className="text-sm">{selectedCountryCode.flag}</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showCountryDropdown && (
                                <div className="absolute z-40 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg max-h-44 overflow-auto">
                                    {COUNTRY_CODES.map((cc) => (
                                        <button
                                            key={cc.code}
                                            onClick={() => { setSelectedCountryCode(cc); setShowCountryDropdown(false); }}
                                            className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 ${selectedCountryCode.code === cc.code ? "bg-blue-50" : ""}`}
                                        >
                                            <span className="text-base">{cc.flag}</span>
                                            <span className="text-xs font-medium">{cc.code}</span>
                                            <span className="text-[10px] text-gray-500">{cc.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <input
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9123456789"
                            className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:ring-1.5 focus:ring-blue-500 text-sm"
                        />
                    </div>
                ) : (
                    <input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:ring-1.5 focus:ring-blue-500 text-sm"
                    />
                )}
                
                {isEwallet && (
                    <p className="text-[10px] text-gray-500 mt-1">Ex: {selectedCountryCode.code} 912 345 6789</p>
                )}
            </div>

            {/* Info Box - Important Warning */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-[10px] sm:text-xs font-semibold text-red-800">
                            Double-check your account details
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-red-700">
                            Incorrect account numbers or mobile numbers will cause payment failures. 
                            Disputes can take 3-5 business days to resolve.
                        </p>
                    </div>
                </div>
            </div>

            {/* Secondary Info */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] sm:text-xs text-amber-800">
                        Account name must match your verification details exactly.
                    </p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
                    <p className="text-xs text-red-600">{error}</p>
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className={`w-full py-3 rounded-xl font-semibold text-white text-sm transition-all ${
                    !isValid || saving ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-emerald-600"
                }`}
            >
                {saving ? "Saving..." : "Save Payout Information"}
            </button>

            {/* Partners Modal */}
            {showPartnersModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:bg-black/40 p-0">
                    <div 
                        className="absolute inset-0 sm:hidden" 
                        onClick={() => setShowPartnersModal(false)} 
                    />
                    
                    <div className="relative w-full sm:w-auto sm:min-w-[340px] sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl sm:max-h-[55vh] overflow-hidden flex flex-col">
                        {/* Handle */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-8 h-1 bg-gray-300 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-bold text-sm text-gray-800">Payout Partners</h3>
                            <button onClick={() => setShowPartnersModal(false)} className="p-1 -mr-1 rounded-lg hover:bg-gray-100">
                                <FiX className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 py-2">
                            <div className="mb-2">
                                <p className="text-[9px] font-semibold text-gray-500 uppercase px-2 mb-1">Banks</p>
                                {channels.filter(c => c.type === "BANK").map((c) => (
                                    <div key={c.code} className="px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <span className="text-xs text-gray-800">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div>
                                <p className="text-[9px] font-semibold text-gray-500 uppercase px-2 mb-1">E-wallets</p>
                                {channels.filter(c => c.type === "EWALLET").map((c) => (
                                    <div key={c.code} className="px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <span className="text-xs text-gray-800">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-4 py-3 border-t">
                            <button
                                onClick={() => setShowPartnersModal(false)}
                                className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
