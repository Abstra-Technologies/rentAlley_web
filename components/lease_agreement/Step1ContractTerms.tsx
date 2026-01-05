"use client";

import {
    FileCog,
    Users,
    AlertTriangle,
} from "lucide-react";

interface Props {
    form: any;
    setForm: (v: any) => void;
    leaseDetails: any;
    config: any;
    rentChanged: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNext: () => void;
}

export default function Step1ContractTerms({
                                               form,
                                               setForm,
                                               leaseDetails,
                                               config,
                                               rentChanged,
                                               onChange,
                                               onNext,
                                           }: Props) {
    const unitRent = String(leaseDetails?.rent_amount ?? "");
    const currentRent = String(form.rent_amount ?? "");

    const rentDiffersFromUnit =
        currentRent !== "" && unitRent !== "" && currentRent !== unitRent;

    return (
        <>
            {/* 🏷️ Header */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileCog className="w-5 h-5 text-blue-600" />
                Review & Set Contract Terms
            </h2>

            {/* 🆕 Lease Type */}
            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                    Lease Type
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                    <LeaseTypeButton
                        active={form.lease_type === "residential"}
                        color="blue"
                        label="🏠 Residential Lease"
                        onClick={() =>
                            setForm((prev: any) => ({ ...prev, lease_type: "residential" }))
                        }
                    />
                    <LeaseTypeButton
                        active={form.lease_type === "commercial"}
                        color="emerald"
                        label="🏢 Commercial Lease"
                        onClick={() =>
                            setForm((prev: any) => ({ ...prev, lease_type: "commercial" }))
                        }
                    />
                </div>
            </div>

            {/* 🧩 Tenant & Landlord */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6 border-b pb-4">
                <PartyInfo
                    title="Tenant Information"
                    iconColor="emerald"
                    data={{
                        name: leaseDetails?.tenant_name,
                        email: leaseDetails?.tenant_email,
                        phone: leaseDetails?.tenant_phone,
                        address: leaseDetails?.tenant_address,
                        citizenship: leaseDetails?.tenant_citizenship,
                        civil_status: leaseDetails?.tenant_civil_status,
                        birthdate: leaseDetails?.tenant_birthdate,
                    }}
                />

                <PartyInfo
                    title="Landlord Information"
                    iconColor="blue"
                    data={{
                        name: leaseDetails?.landlord_name,
                        email: leaseDetails?.landlord_email,
                        phone: leaseDetails?.landlord_phone,
                        address: leaseDetails?.landlord_address,
                        citizenship: leaseDetails?.landlord_citizenship,
                        civil_status: leaseDetails?.landlord_civil_status,
                        birthdate: leaseDetails?.landlord_birthdate,
                    }}
                />
            </div>

            {/* ⚠️ RENT CHANGE WARNING (LEASE + UNIT UPDATE) */}
            {rentDiffersFromUnit && (
                <div className="mb-5 flex items-start gap-2 bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
            The rent amount you entered (
            <strong>₱{Number(currentRent).toLocaleString()}</strong>) differs
            from the unit’s default rent (
            <strong>₱{Number(unitRent).toLocaleString()}</strong>).
            <br />
            This amount will be <strong>charged for this lease</strong> and
            <strong> will automatically modify the unit’s configured rent</strong>.
          </span>
                </div>
            )}

            {/* ⚙️ Contract Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* Dates */}
                <DateInput
                    label="Start Date"
                    name="start_date"
                    value={form.start_date || leaseDetails?.start_date?.split("T")[0]}
                    onChange={onChange}
                />

                <DateInput
                    label="End Date"
                    name="end_date"
                    value={form.end_date || leaseDetails?.end_date?.split("T")[0]}
                    onChange={onChange}
                />

                {/* Financials */}
                <NumberInput
                    label="Monthly Rent (₱)"
                    name="rent_amount"
                    value={form.rent_amount}
                    onChange={onChange}
                />

                <NumberInput
                    label="Security Deposit (₱)"
                    name="security_deposit"
                    value={form.security_deposit || ""}
                    onChange={onChange}
                />

                <NumberInput
                    label="Advance Payment (₱)"
                    name="advance_payment"
                    value={form.advance_payment || ""}
                    onChange={onChange}
                />

                {/* Read-only billing config */}
                <ReadOnlyInput
                    label="Billing Due Day"
                    value={form.billing_due_day}
                />

                <ReadOnlyInput
                    label="Grace Period (Days)"
                    value={form.grace_period_days}
                />

                <ReadOnlyInput
                    label="Late Fee (₱)"
                    value={form.late_fee_amount}
                />

                {/* ℹ️ Property-level config notice */}
                <div className="sm:col-span-2 mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
            <strong>Billing Due Day</strong>, <strong>Grace Period</strong>, and
            <strong> Late Fee</strong> are managed at the
            <strong> property configuration level</strong> and cannot be
            modified per lease.
          </span>
                </div>
            </div>

            {/* Continue */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!form.lease_type}
                    className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 disabled:bg-gray-300"
                >
                    Continue →
                </button>
            </div>
        </>
    );
}

/* ───────────────── Subcomponents ───────────────── */

function LeaseTypeButton({ active, color, label, onClick }: any) {
    const activeStyles =
        color === "blue"
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-emerald-500 bg-emerald-50 text-emerald-700";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                active ? activeStyles : "border-gray-200 bg-white text-gray-700"
            }`}
        >
            {label}
        </button>
    );
}

function PartyInfo({ title, iconColor, data }: any) {
    return (
        <div>
            <h3 className="text-gray-800 font-semibold mb-2 flex items-center gap-2">
                <Users className={`w-4 h-4 text-${iconColor}-600`} />
                {title}
            </h3>

            <InfoRow label="Name" value={data.name} />
            <InfoRow label="Email" value={data.email} />
            <InfoRow label="Phone" value={data.phone} />
            <InfoRow label="Address" value={data.address} />
            <InfoRow label="Citizenship" value={data.citizenship} />
            <InfoRow label="Civil Status" value={data.civil_status} />

            {data.birthdate && (
                <InfoRow
                    label="Age"
                    value={`${Math.floor(
                        (Date.now() - new Date(data.birthdate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365.25)
                    )} years old`}
                />
            )}
        </div>
    );
}

function InfoRow({ label, value }: any) {
    return (
        <p>
            <span className="font-medium text-gray-500">{label}:</span>{" "}
            {value || "N/A"}
        </p>
    );
}

function DateInput({ label, ...props }: any) {
    return (
        <label className="flex flex-col">
            <span className="text-gray-600 mb-1 font-medium">{label}</span>
            <input type="date" className="border rounded-lg p-2" {...props} />
        </label>
    );
}

function NumberInput({ label, ...props }: any) {
    return (
        <label className="flex flex-col">
            <span className="text-gray-600 mb-1 font-medium">{label}</span>
            <input type="number" className="border rounded-lg p-2" {...props} />
        </label>
    );
}

function ReadOnlyInput({ label, value }: any) {
    return (
        <label className="flex flex-col">
            <span className="text-gray-600 mb-1 font-medium">{label}</span>
            <input
                value={value}
                readOnly
                className="border rounded-lg p-2 bg-gray-100 cursor-not-allowed"
            />
        </label>
    );
}
