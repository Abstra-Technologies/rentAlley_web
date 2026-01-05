"use client";

import {
    FileSignature,
    Wallet,
    CalendarRange,
    ClipboardCheck,
    ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

interface Props {
    lease: any;
    onClose: () => void;
    onContinue: (data: any) => void;
}

const formatDateForInput = (date?: string | null) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

export default function ChecklistSetupModal({
                                                lease,
                                                onClose,
                                                onContinue,
                                            }: Props) {
    const agreement_id = lease.lease_id;

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showDecision, setShowDecision] = useState(false);

    const [form, setForm] = useState({
        lease_agreement: false,
        security_deposit: false,
        advance_payment: false,
        set_lease_dates: false,
        lease_start_date: "",
        lease_end_date: "",
    });

    const leaseIncludesOthers = form.lease_agreement;

    const hasInvalidDates =
        form.set_lease_dates &&
        form.lease_start_date &&
        form.lease_end_date &&
        new Date(form.lease_end_date) < new Date(form.lease_start_date);

    /* ================= LOAD EXISTING ================= */
    useEffect(() => {
        axios
            .get(
                `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
            )
            .then((res) => {
                const r = res.data?.requirements || {};

                const loadedForm = {
                    lease_agreement: r.lease_agreement === 1,
                    security_deposit: r.security_deposit === 1,
                    advance_payment: r.advance_payment === 1,
                    set_lease_dates: !!(
                        res.data?.lease_start_date || res.data?.lease_end_date
                    ),
                    lease_start_date: formatDateForInput(res.data?.lease_start_date),
                    lease_end_date: formatDateForInput(res.data?.lease_end_date),
                };

                setForm(loadedForm);

                if (
                    loadedForm.lease_agreement ||
                    loadedForm.security_deposit ||
                    loadedForm.advance_payment
                ) {
                    setShowDecision(true);
                }
            })
            .catch(() => {});
    }, [agreement_id]);

    /* ================= SAVE ================= */
    const handleSave = async () => {
        if (hasInvalidDates) {
            Swal.fire({
                icon: "warning",
                title: "Invalid lease dates",
                text: "End date cannot be earlier than the start date.",
            });
            return;
        }

        setLoading(true);
        Swal.fire({
            title: "Saving lease setup...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const payload = {
                agreement_id,

                lease_agreement: form.lease_agreement,

                // 🔒 COMING SOON – hard disabled
                move_in_checklist: false,
                move_out_checklist: false,

                security_deposit: form.security_deposit,
                advance_payment: form.advance_payment,

                lease_start_date: form.set_lease_dates
                    ? form.lease_start_date || null
                    : null,
                lease_end_date: form.set_lease_dates
                    ? form.lease_end_date || null
                    : null,
            };

            await axios.post(
                "/api/landlord/activeLease/saveChecklistRequirements",
                payload
            );

            Swal.close();

            if (form.lease_agreement) {
                Swal.fire({
                    icon: "success",
                    title: "Lease setup saved",
                    text: "Continue setting up the lease.",
                }).then(() => onContinue(payload));
            } else {
                Swal.fire({
                    icon: "success",
                    title: "Checklist saved",
                    text: "Requirements updated successfully.",
                }).then(onClose);
            }
        } catch {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Save failed",
                text: "Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl sm:max-w-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold">Lease Setup</h2>
                <p className="text-sm text-gray-600 mt-1 mb-6">
                    Configure lease requirements. Payments, dates, and checklists
                    are handled independently.
                </p>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
                        {errorMessage}
                    </div>
                )}

                {showDecision ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                            This lease already has existing setup requirements.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => onContinue(form)}
                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm"
                            >
                                Continue Setup
                            </button>
                            <button
                                onClick={() => setShowDecision(false)}
                                className="flex-1 py-2 rounded-lg border text-sm"
                            >
                                Edit Checklist
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Lease Agreement */}
                        <Option
                            checked={form.lease_agreement}
                            onChange={() =>
                                setForm((p) => ({
                                    ...p,
                                    lease_agreement: !p.lease_agreement,
                                }))
                            }
                            icon={<FileSignature className="w-4 h-4 text-blue-600" />}
                            disabled={loading}
                            label={
                                <div>
                                    <div className="font-medium">Lease Agreement</div>
                                    <div className="text-xs text-gray-500">
                                        Includes deposits, advance payment, and lease dates
                                    </div>
                                </div>
                            }
                        />

                        {/* Coming Soon */}
                        <ComingSoonOption
                            icon={<ClipboardCheck className="w-4 h-4 text-gray-400" />}
                            label="Move-In Checklist"
                        />

                        <ComingSoonOption
                            icon={<ClipboardList className="w-4 h-4 text-gray-400" />}
                            label="Move-Out Checklist"
                        />

                        {/* Payments */}
                        <Option
                            checked={form.security_deposit}
                            onChange={() =>
                                setForm((p) => ({
                                    ...p,
                                    security_deposit: !p.security_deposit,
                                }))
                            }
                            icon={<Wallet className="w-4 h-4 text-emerald-600" />}
                            disabled={loading || leaseIncludesOthers}
                            label={
                                leaseIncludesOthers
                                    ? "Security Deposit (included)"
                                    : "Security Deposit"
                            }
                        />

                        <Option
                            checked={form.advance_payment}
                            onChange={() =>
                                setForm((p) => ({
                                    ...p,
                                    advance_payment: !p.advance_payment,
                                }))
                            }
                            icon={<Wallet className="w-4 h-4 text-purple-600" />}
                            disabled={loading || leaseIncludesOthers}
                            label={
                                leaseIncludesOthers
                                    ? "Advance Payment (included)"
                                    : "Advance Payment"
                            }
                        />

                        {/* Lease Dates */}
                        <Option
                            checked={form.set_lease_dates}
                            onChange={() =>
                                setForm((p) => ({
                                    ...p,
                                    set_lease_dates: !p.set_lease_dates,
                                }))
                            }
                            icon={<CalendarRange className="w-4 h-4 text-indigo-600" />}
                            disabled={loading || leaseIncludesOthers}
                            label="Set Lease Dates Only"
                        />

                        {form.set_lease_dates && (
                            <div className="ml-7 space-y-3">
                                <DateField
                                    label="Lease Start Date (required)"
                                    value={form.lease_start_date}
                                    onChange={(v) =>
                                        setForm((p) => ({ ...p, lease_start_date: v }))
                                    }
                                />
                                <DateField
                                    label="Lease End Date (optional)"
                                    value={form.lease_end_date}
                                    onChange={(v) =>
                                        setForm((p) => ({ ...p, lease_end_date: v }))
                                    }
                                />
                            </div>
                        )}

                        {hasInvalidDates && (
                            <p className="text-xs text-red-600">
                                End date cannot be earlier than start date.
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || hasInvalidDates}
                                className={`px-5 py-2 rounded-lg text-white ${
                                    loading || hasInvalidDates
                                        ? "bg-gray-400"
                                        : "bg-gradient-to-r from-blue-600 to-emerald-600"
                                }`}
                            >
                                {loading ? "Saving..." : "Continue"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================= COMPONENTS ================= */

function Option({ checked, onChange, icon, label, disabled }: any) {
    return (
        <label
            className={`flex items-start gap-3 ${
                disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
        >
            <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
            />
            {icon}
            <div className="text-sm">{label}</div>
        </label>
    );
}

function ComingSoonOption({ icon, label }: any) {
    return (
        <div className="flex items-start gap-3 opacity-60 cursor-not-allowed">
            <input type="checkbox" disabled className="mt-1 h-4 w-4" />
            {icon}
            <div className="text-sm flex items-center gap-2">
                <span className="text-gray-500">{label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    Coming Soon
                </span>
            </div>
        </div>
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
