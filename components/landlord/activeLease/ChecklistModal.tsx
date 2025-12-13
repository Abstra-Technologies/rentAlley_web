"use client";

import { FileSignature, Wallet, CalendarRange } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { formatDate } from "@/utils/formatter/formatters";

interface Props {
    lease: any;
    onClose: () => void;
    onContinue: (data: any) => void;
}

/* ----------------------------------------------------
 * Helper for <input type="date">
 * -------------------------------------------------- */
const formatDateForInput = (date?: string | null): string => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
};

export default function ChecklistSetupModal({
                                                lease,
                                                onClose,
                                                onContinue,
                                            }: Props) {
    const agreement_id = lease.lease_id;

    const [form, setForm] = useState({
        lease_agreement: false,
        security_deposit: false,
        advance_payment: false,
        set_lease_dates: false,
        lease_start_date: "",
        lease_end_date: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    /* ----------------------------------------------------
     * LOAD EXISTING CHECKLIST + LEASE DATES
     * -------------------------------------------------- */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(
                    `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
                );

                const r = res.data?.requirements || {};

                const leaseStart = formatDateForInput(res.data?.lease_start_date);
                const leaseEnd = formatDateForInput(res.data?.lease_end_date);

                setForm({
                    lease_agreement: r.lease_agreement === 1,
                    security_deposit: r.security_deposit === 1,
                    advance_payment: r.advance_payment === 1,

                    // auto-enable if dates exist
                    set_lease_dates: !!(leaseStart || leaseEnd),

                    // formatted for date input
                    lease_start_date: leaseStart,
                    lease_end_date: leaseEnd,
                });
            } catch {
                // first-time setup
            }
        };

        load();
    }, [agreement_id]);

    /* ----------------------------------------------------
     * SAVE
     * -------------------------------------------------- */
    const handleSave = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const existing = await axios.get(
                `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
            );

            const payload = {
                agreement_id,
                lease_agreement: form.lease_agreement,
                security_deposit: form.security_deposit,
                advance_payment: form.advance_payment,
                lease_start_date: form.set_lease_dates
                    ? form.lease_start_date || null
                    : null,
                lease_end_date: form.set_lease_dates
                    ? form.lease_end_date || null
                    : null,
            };

            if (existing.data?.requirements) {
                await axios.put(
                    "/api/landlord/activeLease/saveChecklistRequirements",
                    payload
                );
            } else {
                await axios.post(
                    "/api/landlord/activeLease/saveChecklistRequirements",
                    payload
                );
            }

            setLoading(false);
            onContinue(payload);
        } catch (err) {
            console.error(err);
            setLoading(false);
            setErrorMessage("Failed to save setup. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

                {/* HEADER */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Lease Setup Options
                </h2>
                <p className="text-sm text-gray-600 mb-5">
                    Select any options that apply. You may choose multiple.
                </p>

                {/* ERROR */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
                        {errorMessage}
                    </div>
                )}

                {/* OPTIONS */}
                <div className="space-y-4">

                    <Option
                        checked={form.lease_agreement}
                        onChange={() =>
                            setForm((p) => ({ ...p, lease_agreement: !p.lease_agreement }))
                        }
                        icon={<FileSignature className="w-4 h-4 text-blue-600" />}
                        label="Lease Agreement"
                        disabled={loading}
                    />

                    <Option
                        checked={form.security_deposit}
                        onChange={() =>
                            setForm((p) => ({ ...p, security_deposit: !p.security_deposit }))
                        }
                        icon={<Wallet className="w-4 h-4 text-emerald-600" />}
                        label="Security Deposit"
                        disabled={loading}
                    />

                    <Option
                        checked={form.advance_payment}
                        onChange={() =>
                            setForm((p) => ({ ...p, advance_payment: !p.advance_payment }))
                        }
                        icon={<Wallet className="w-4 h-4 text-purple-600" />}
                        label="Advance Payment"
                        disabled={loading}
                    />

                    <Option
                        checked={form.set_lease_dates}
                        onChange={() =>
                            setForm((p) => ({ ...p, set_lease_dates: !p.set_lease_dates }))
                        }
                        icon={<CalendarRange className="w-4 h-4 text-indigo-600" />}
                        label="Set Lease Dates"
                        disabled={loading}
                    />

                    {form.set_lease_dates && (
                        <div className="ml-7 space-y-3">
                            <DateField
                                label="Lease Start Date"
                                value={form.lease_start_date}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, lease_start_date: v }))
                                }
                            />
                            <DateField
                                label="Lease End Date"
                                value={form.lease_end_date}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, lease_end_date: v }))
                                }
                            />

                            {(form.lease_start_date || form.lease_end_date) && (
                                <p className="text-xs text-gray-500">
                                    Current Lease Period:{" "}
                                    {formatDate(form.lease_start_date)}{" "}
                                    {form.lease_end_date &&
                                        `– ${formatDate(form.lease_end_date)}`}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow"
                    >
                        {loading ? "Saving..." : "Continue"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Option({ checked, onChange, icon, label, disabled }: any) {
    return (
        <label className="flex items-center gap-3">
            <input
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
            />
            {icon}
            <span className="text-sm text-gray-800">{label}</span>
        </label>
    );
}

function DateField({ label, value, onChange }: any) {
    return (
        <div>
            <label className="block text-sm text-gray-600 mb-1">{label}</label>
            <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
