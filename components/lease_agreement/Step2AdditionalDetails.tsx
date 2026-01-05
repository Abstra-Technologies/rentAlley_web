"use client";

import { CheckCircle2, ArrowLeft } from "lucide-react";

interface Props {
    form: any;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onBack: () => void;
    onNext: () => void;
}

export default function Step2AdditionalDetails({
                                                   form,
                                                   onChange,
                                                   onBack,
                                                   onNext,
                                               }: Props) {
    const isCommercial = form.lease_type === "commercial";

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Additional Lease Terms
            </h2>

            <p className="text-sm text-gray-600 mb-6">
                These clauses form part of the lease agreement and define usage,
                responsibilities, and legal protections for both parties.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* USE & OCCUPANCY */}
                <Select
                    label="Use of Premises"
                    name="use_of_premises"
                    value={form.use_of_premises}
                    onChange={onChange}
                    options={
                        isCommercial
                            ? [
                                ["business_only", "Business use only"],
                                ["office_retail", "Office / Retail operations"],
                                ["mixed_use", "Approved mixed-use"],
                            ]
                            : [
                                ["residential_only", "Residential use only"],
                                ["no_business", "No business activity allowed"],
                            ]
                    }
                />

                <Select
                    label="Allowed Occupants"
                    name="allowed_occupants"
                    value={form.allowed_occupants}
                    onChange={onChange}
                    options={[
                        ["1", "1 person"],
                        ["2", "Up to 2 persons"],
                        ["3", "Up to 3 persons"],
                        ["4", "Up to 4 persons"],
                        ["5+", "5 or more (with approval)"],
                    ]}
                />

                {/* UTILITIES & MAINTENANCE */}
                <Select
                    label="Utilities Responsibility"
                    name="utilities"
                    value={form.utilities}
                    onChange={onChange}
                    options={[
                        ["tenant", "Tenant pays utilities"],
                        ["landlord", "Landlord covers utilities"],
                        ["shared", "Shared based on usage"],
                    ]}
                />

                <Select
                    label="Maintenance & Repairs"
                    name="maintenance_responsibility"
                    value={form.maintenance_responsibility}
                    onChange={onChange}
                    options={[
                        ["tenant_minor_landlord_major", "Tenant minor / Landlord major"],
                        ["landlord_all", "Landlord responsible for all"],
                        ["tenant_all", "Tenant responsible for all"],
                    ]}
                />

                {/* ENTRY & RULES */}
                <Select
                    label="Landlord Entry & Inspection"
                    name="entry_notice"
                    value={form.entry_notice}
                    onChange={onChange}
                    options={[
                        ["24hr_notice", "24-hour prior notice"],
                        ["48hr_notice", "48-hour written notice"],
                        ["emergency_entry", "Emergency access only"],
                        ["scheduled_entry", "Scheduled with tenant consent"],
                    ]}
                />

                <Select
                    label="Rules & Regulations"
                    name="house_rules"
                    value={form.house_rules}
                    onChange={onChange}
                    options={[
                        ["standard", "Subject to property rules"],
                        ["strict", "Strict enforcement of rules"],
                        ["commercial_policy", "Commercial operations policy"],
                    ]}
                />

                {/* PETS */}
                <Select
                    label="Pet Policy"
                    name="pet_policy"
                    value={form.pet_policy}
                    onChange={onChange}
                    full
                    options={[
                        ["no_pets", "No pets allowed"],
                        ["small_pets_allowed", "Small pets allowed with approval"],
                        ["pets_allowed", "Pets allowed (tenant liable for damages)"],
                    ]}
                />

                {/* ALTERATIONS & SUBLETTING */}
                <Select
                    label="Alterations & Improvements"
                    name="alterations_policy"
                    value={form.alterations_policy}
                    onChange={onChange}
                    full
                    options={[
                        ["not_allowed", "No alterations allowed"],
                        ["minor_with_consent", "Minor alterations with consent"],
                        ["allowed_with_approval", "Allowed with written approval"],
                    ]}
                />

                <Select
                    label="Subletting & Assignment"
                    name="subleasing_policy"
                    value={form.subleasing_policy}
                    onChange={onChange}
                    full
                    options={[
                        ["not_allowed", "Subletting not allowed"],
                        ["with_consent", "Allowed with landlord consent"],
                        ["commercial_allowed", "Allowed for approved subtenants"],
                    ]}
                />

                {/* LEGAL & RISK */}
                <Select
                    label="Insurance Requirement"
                    name="insurance_requirement"
                    value={form.insurance_requirement}
                    onChange={onChange}
                    full
                    options={[
                        ["tenant_required", "Tenant must maintain insurance"],
                        ["landlord_provided", "Covered under landlord insurance"],
                        ["commercial_required", "Commercial insurance required"],
                    ]}
                />

                <Select
                    label="Force Majeure Clause"
                    name="force_majeure"
                    value={form.force_majeure}
                    onChange={onChange}
                    full
                    options={[
                        ["included", "Included (acts of God, disasters, emergencies)"],
                        ["excluded", "Not applicable"],
                    ]}
                />

                <Select
                    label="Default & Remedies"
                    name="default_remedies"
                    value={form.default_remedies}
                    onChange={onChange}
                    full
                    options={[
                        ["notice_then_action", "Written notice before action"],
                        ["immediate_action", "Immediate remedies allowed"],
                        ["legal_process", "Subject to legal proceedings"],
                    ]}
                />

                <Select
                    label="Termination Clause"
                    name="termination_clause"
                    value={form.termination_clause}
                    onChange={onChange}
                    full
                    options={[
                        ["non_payment", "Non-payment or material breach"],
                        ["mutual", "Mutual termination agreement"],
                        ["fixed_term", "Automatic termination at lease end"],
                        ["violation", "Immediate termination for violations"],
                    ]}
                />

                <Select
                    label="Renewal Terms"
                    name="renewal_terms"
                    value={form.renewal_terms}
                    onChange={onChange}
                    full
                    options={[
                        ["renewable", "Renewable upon mutual agreement"],
                        ["non_renewable", "Non-renewable"],
                        ["auto_renew_with_notice", "Auto-renew unless notice is given"],
                    ]}
                />

                <Select
                    label="Governing Law"
                    name="governing_law"
                    value={form.governing_law}
                    onChange={onChange}
                    full
                    options={[
                        ["philippines", "Republic of the Philippines"],
                        ["local_jurisdiction", "Local jurisdiction"],
                    ]}
                />
            </div>

            <div className="mt-6 flex justify-between gap-3">
                <button
                    onClick={onBack}
                    className="px-5 py-2.5 border rounded-lg text-gray-600 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                    onClick={onNext}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg"
                >
                    Continue →
                </button>
            </div>
        </div>
    );
}

function Select({ label, name, value, onChange, options, full }: any) {
    return (
        <label className={`flex flex-col ${full ? "sm:col-span-2" : ""}`}>
            <span className="text-gray-600 mb-1 font-medium">{label}</span>
            <select
                name={name}
                value={value ?? ""}
                onChange={onChange}
                className="border rounded-lg p-2 bg-white"
            >
                <option value="">Select…</option>
                {options.map(([v, l]: any) => (
                    <option key={v} value={v}>
                        {l}
                    </option>
                ))}
            </select>
        </label>
    );
}
