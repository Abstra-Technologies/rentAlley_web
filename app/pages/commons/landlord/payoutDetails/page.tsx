"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import { BackButton } from "@/components/navigation/backButton";

export default function PayoutDetails() {
    const { user, fetchSession } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [method, setMethod] = useState("gcash");
    const [form, setForm] = useState({
        account_name: "",
        account_number: "",
        bank_name: ""
    });

    // Store DB data for Change Log
    const [accountData, setAccountData] = useState(null);

    // Fetch saved payout details from API
    const fetchPayoutAccount = async () => {
        try {
            const res = await axios.get("/api/landlord/payout/getAccount", {
                params: { landlord_id },
            });

            if (res.data?.account) {
                const acc = res.data.account;
                setAccountData(acc); // store raw DB record for Change Log

                setMethod(acc.payout_method);
                setForm({
                    account_name: acc.account_name,
                    account_number: acc.account_number,
                    bank_name: acc.bank_name || "",
                });
            }
        } catch (err) {
            console.warn("No existing payout record found");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) fetchSession();
        if (user?.landlord_id) fetchPayoutAccount();
    }, [user]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!form.account_name || !form.account_number) {
            Swal.fire("Missing Fields", "Please complete all required fields.", "warning");
            return;
        }

        // Build summary for confirmation
        const summaryHtml = `
            <div style="text-align:left; font-size:14px;">
                <strong>Payout Method:</strong> ${method.toUpperCase()} <br>
                <strong>Account Name:</strong> ${form.account_name} <br>
                <strong>${method === "bank_transfer" ? "Account Number" : "Mobile Number"}:</strong> ${form.account_number} <br>
                ${
            method === "bank_transfer"
                ? `<strong>Bank Name:</strong> ${form.bank_name || "N/A"}`
                : ""
        }
            </div>
        `;

        // Confirmation modal
        const confirm = await Swal.fire({
            title: "Please Double-Check Your Details",
            html: `
                <p class="mb-2">Make sure your payout details are <strong>correct</strong>.</p>
                ${summaryHtml}
                <br>
                <p style="color:#b91c1c; font-size:13px;">Incorrect details may cause payout delays.</p>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, save it",
            cancelButtonText: "Review Again",
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#6b7280",
        });

        if (!confirm.isConfirmed) return;

        setSaving(true);

        try {
            await axios.post("/api/landlord/payout/saveAccount", {
                landlord_id,
                payout_method: method,
                account_name: form.account_name,
                account_number: form.account_number,
                bank_name: method === "bank_transfer" ? form.bank_name : null,
            });

            Swal.fire("Saved!", "Your payout details have been updated.", "success");

            // Refresh Change Log data
            fetchPayoutAccount();
        } catch (err) {
            Swal.fire("Error", "Failed to save payout details.", "error");
        }

        setSaving(false);
    };

    return (
            <div className="min-h-screen bg-gray-50 p-5">

                <BackButton label="Back" />

                <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md mt-5">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Payout Details</h1>
                    <p className="text-gray-500 mb-6 text-sm">
                        Payouts will be sent to the account you set below.
                    </p>

                    {loading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : (
                        <>
                            {/* Payout Method */}
                            <label className="block mb-2 font-semibold text-gray-700">
                                Payout Method
                            </label>
                            <select
                                className="w-full border p-2 rounded-md mb-4"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                            >
                                <option value="gcash">GCash</option>
                                <option value="maya">Maya</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>

                            {/* Account Name */}
                            <label className="block mb-2 font-semibold text-gray-700">
                                Account Name
                            </label>
                            <input
                                name="account_name"
                                value={form.account_name}
                                onChange={handleChange}
                                className="w-full border p-2 rounded-md mb-4"
                                placeholder="Account Holder Name"
                            />

                            {/* Account Number / Mobile */}
                            <label className="block mb-2 font-semibold text-gray-700">
                                {method === "bank_transfer" ? "Account Number" : "Mobile Number"}
                            </label>
                            <input
                                name="account_number"
                                value={form.account_number}
                                onChange={handleChange}
                                className="w-full border p-2 rounded-md mb-4"
                                placeholder={method === "bank_transfer" ? "Account Number" : "09XXXXXXXXX"}
                            />

                            {/* Bank Name */}
                            {method === "bank_transfer" && (
                                <>
                                    <label className="block mb-2 font-semibold text-gray-700">
                                        Bank Name
                                    </label>
                                    <input
                                        name="bank_name"
                                        value={form.bank_name}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded-md mb-6"
                                        placeholder="BDO, BPI, Metrobank..."
                                    />
                                </>
                            )}

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                                    saving ? "bg-gray-500" : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    )}
                </div>

                {/* API-BASED CHANGE LOG SECTION */}
                <div className="max-w-2xl mx-auto mt-8 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Change Log</h2>

                    {!accountData ? (
                        <p className="text-sm text-gray-500 italic">
                            No payout details have been saved yet.
                        </p>
                    ) : (
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                <strong>Date Created:</strong>{" "}
                                {new Date(accountData.created_at).toLocaleString()}
                            </p>
                            <p>
                                <strong>Last Updated:</strong>{" "}
                                {new Date(accountData.updated_at).toLocaleString()}
                            </p>
                            <p>
                                <strong>Payout Method:</strong>{" "}
                                {accountData.payout_method ? accountData.payout_method.toUpperCase() : "N/A"}
                            </p>
                            <p>
                                <strong>
                                    {accountData.payout_method === "bank_transfer"
                                        ? "Account Number"
                                        : "Mobile Number"}
                                    :
                                </strong>{" "}
                                {accountData.account_number}
                            </p>
                            <p>
                                <strong>Account Name:</strong>{" "}
                                {accountData.account_name}
                            </p>

                            {accountData.payout_method === "bank_transfer" && (
                                <p>
                                    <strong>Bank:</strong>{" "}
                                    {accountData.bank_name || "N/A"}
                                </p>
                            )}
                        </div>
                    )}
                </div>

            </div>
    );
}
