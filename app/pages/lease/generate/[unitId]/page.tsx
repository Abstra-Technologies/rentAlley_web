"use client";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { EXTRA_EXPENSES } from "@/constant/extraExpenses";
import { PAYMENT_METHODS } from "@/constant/paymentMethods";
import { PENALTY_TYPES } from "@/constant/penaltyTypes";
import { RENT_INCLUSIONS } from "@/constant/rentInclusions";
import { RENEWAL_OPTIONS } from "@/constant/renewalOptions";
import { MAINTENANCE_CHARGES } from "@/constant/maintenanceCharges";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import { USE_OF_PROPERTY } from "@/constant/useOfProperty";
import { MAINTENANCE_RESPONSIBILITY } from "@/constant/maintenanceResponsibility";
import { buildLeaseTemplate } from "@/utils/buildLeaseTemplate";
import { useRouter } from "next/navigation";

type TenantInfo = {
    name?: string;
    email?: string;
    phone?: string;
};

type PropertyInfo = {
    id?: string;
    name?: string;
    address?: string;
};

type UnitInfo = {
    id?: string;
    name?: string;
    property_id?: string;
    rent_amount?: number | string;
};

export default function LeaseEditor() {
    const searchParams = useSearchParams();
    const { user, fetchSession } = useAuthStore();
    const STORAGE_KEY = "lease_editor_state";
    const router = useRouter();

    const getInitialState = () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return parsed.step || 1;
                } catch {
                    return 1;
                }
            }
        }
        return 1;
    };

    // ----- Step control -----
    const [step, setStep] = useState<number>(getInitialState);

    // ----- Part 1 state -----
    const [tenant, setTenant] = useState<TenantInfo>({});
    const [property, setProperty] = useState<PropertyInfo>({});
    const [unit, setUnit] = useState<UnitInfo>({});
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [renewalOption, setRenewalOption] = useState("fixed");
    const [renewalNoticeDays, setRenewalNoticeDays] = useState("30");

    const [depositAmount, setDepositAmount] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState("");
    const [billingDueDay, setBillingDueDay] = useState("1");
    const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
    const [included, setIncluded] = useState<string[]>([]);
    const [rentAmount, setRentAmount] = useState("");
    const [excludedFees, setExcludedFees] = useState<
        { key: string; amount: string }[]
    >([]);
    const [percentageIncrease, setPercentageIncrease] = useState("");

    const [gracePeriod, setGracePeriod] = useState("3");
    const [latePenalty, setLatePenalty] = useState("1000");
    const [otherPenalties, setOtherPenalties] = useState<
        { key: string; amount: string }[]
    >([]);

    const [maintenanceCharges, setMaintenanceCharges] = useState<
        { key: string; amount: string }[]
    >([]);
    const [entryNoticeDays, setEntryNoticeDays] = useState("24");
    const [useOfProperty, setUseOfProperty] = useState("residential_only");
    const [maintenanceResponsibility, setMaintenanceResponsibility] = useState("landlord_major_tenant_minor");

    const [occupancyLimit, setOccupancyLimit] = useState("2");

    const [content, setContent] = useState("");

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [fileBase64, setFileBase64] = useState<string | null>(null);
    const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);
    const [signUrl, setSignUrl] = useState<string | null>(null);
    const [agreementId, setAgreementId] = useState<string | null>(null);
    const [envelopeId, setEnvelopeId] = useState<string | null>(null);

    // ----- Utils -----
    const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
    };

    const handleAddPenalty = () => {
        setOtherPenalties([...otherPenalties, { key: "", amount: "" }]);
    };

    const handlePenaltyChange = (index: number, field: string, value: string) => {
        const updated = [...otherPenalties];
        // @ts-ignore
        updated[index][field] = value;
        setOtherPenalties(updated);
    };

    const handleRemovePenalty = (index: number) => {
        setOtherPenalties(otherPenalties.filter((_, i) => i !== index));
    };

    const handleAddExcludedFee = () => {
        setExcludedFees([...excludedFees, { key: "", amount: "" }]);
    };

    const handleExcludedFeeChange = (
        index: number,
        field: string,
        value: string
    ) => {
        const updated = [...excludedFees];
        // @ts-ignore
        updated[index][field] = value;
        setExcludedFees(updated);
    };

    const handleRemoveExcludedFee = (index: number) => {
        setExcludedFees(excludedFees.filter((_, i) => i !== index));
    };

    const handleAddMaintenance = () => {
        setMaintenanceCharges([...maintenanceCharges, { key: "", amount: "" }]);
    };

    const handleMaintenanceChange = (
        index: number,
        field: string,
        value: string
    ) => {
        const updated = [...maintenanceCharges];
        // @ts-ignore
        updated[index][field] = value;
        setMaintenanceCharges(updated);
    };

    const handleRemoveMaintenance = (index: number) => {
        setMaintenanceCharges(maintenanceCharges.filter((_, i) => i !== index));
    };

    const useOfPropertyLabel =
        USE_OF_PROPERTY.find((u) => u.key === useOfProperty)?.label || useOfProperty;

    const maintenanceRespLabel =
        MAINTENANCE_RESPONSIBILITY.find((m) => m.key === maintenanceResponsibility)?.label ||
        maintenanceResponsibility;

    const handleCancel = () => {
        localStorage.removeItem(STORAGE_KEY);
        setStep(1);

        if (unit?.property_id && unit?.id) {
            router.replace(
                `/pages/landlord/property-listing/view-unit/${unit.property_id}/unit-details/${unit.id}`
            );
        } else {
            router.replace("/pages/landlord/property-listing");
        }
    };

    useEffect(() => {
        const stateToSave = {
            step,
            tenant,
            property,
            unit,
            startDate,
            endDate,
            renewalOption,
            renewalNoticeDays,
            depositAmount,
            advanceAmount,
            billingDueDay,
            paymentMethods,
            included,
            rentAmount,
            excludedFees,
            percentageIncrease,
            gracePeriod,
            latePenalty,
            otherPenalties,
            maintenanceCharges,
            entryNoticeDays,
            useOfProperty,
            maintenanceResponsibility,
            occupancyLimit,
            content,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [
        step,
        tenant,
        property,
        unit,
        startDate,
        endDate,
        renewalOption,
        renewalNoticeDays,
        depositAmount,
        advanceAmount,
        billingDueDay,
        paymentMethods,
        included,
        rentAmount,
        excludedFees,
        percentageIncrease,
        gracePeriod,
        latePenalty,
        otherPenalties,
        maintenanceCharges,
        entryNoticeDays,
        useOfProperty,
        maintenanceResponsibility,
        occupancyLimit,
        content,
    ]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.step) setStep(parsed.step);
                if (parsed.tenant) setTenant(parsed.tenant);
                if (parsed.property) setProperty(parsed.property);
                if (parsed.unit) setUnit(parsed.unit);
                if (parsed.startDate) setStartDate(parsed.startDate);
                if (parsed.endDate) setEndDate(parsed.endDate);
                if (parsed.renewalOption) setRenewalOption(parsed.renewalOption);
                if (parsed.renewalNoticeDays) setRenewalNoticeDays(parsed.renewalNoticeDays);
                if (parsed.depositAmount) setDepositAmount(parsed.depositAmount);
                if (parsed.advanceAmount) setAdvanceAmount(parsed.advanceAmount);
                if (parsed.billingDueDay) setBillingDueDay(parsed.billingDueDay);
                if (parsed.paymentMethods) setPaymentMethods(parsed.paymentMethods);
                if (parsed.included) setIncluded(parsed.included);
                if (parsed.rentAmount) setRentAmount(parsed.rentAmount);
                if (parsed.excludedFees) setExcludedFees(parsed.excludedFees);
                if (parsed.percentageIncrease) setPercentageIncrease(parsed.percentageIncrease);
                if (parsed.gracePeriod) setGracePeriod(parsed.gracePeriod);
                if (parsed.latePenalty) setLatePenalty(parsed.latePenalty);
                if (parsed.otherPenalties) setOtherPenalties(parsed.otherPenalties);
                if (parsed.maintenanceCharges) setMaintenanceCharges(parsed.maintenanceCharges);
                if (parsed.entryNoticeDays) setEntryNoticeDays(parsed.entryNoticeDays);
                if (parsed.useOfProperty) setUseOfProperty(parsed.useOfProperty);
                if (parsed.maintenanceResponsibility) setMaintenanceResponsibility(parsed.maintenanceResponsibility);
                if (parsed.occupancyLimit) setOccupancyLimit(parsed.occupancyLimit);
                if (parsed.content) setContent(parsed.content);
            } catch (e) {
                console.error("Failed to parse saved lease state", e);
            }
        }
    }, []);

    // ----- Prefill from URL -----
    useEffect(() => {
        // Dates (optional in URL)
        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");
        if (start) setStartDate(formatDateForInput(start));
        if (end) setEndDate(formatDateForInput(end));

        // Names (optional in URL; will be overridden by fetch if API returns values)
        const urlTenantName = searchParams.get("tenantName");
        const urlPropertyName = searchParams.get("propertyName");
        const urlUnitName = searchParams.get("unitName");

        if (urlTenantName) setTenant((t) => ({ ...t, name: urlTenantName }));
        if (urlPropertyName) setProperty((p) => ({ ...p, name: urlPropertyName }));
        if (urlUnitName) setUnit((u) => ({ ...u, name: urlUnitName }));
    }, [searchParams]);

    // ----- Auth (ensure session) -----
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    // ----- Load Unit -> Property -> Tenant by unitId -----
    useEffect(() => {
        const unitId = searchParams.get("unitId");
        if (!unitId) return;

        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // Get unit details (includes property_id, unit name, rent)
                const uRes = await fetch(`/api/properties/findRent/viewPropUnitDetails?rentId=${unitId}`);
                if (!uRes.ok) throw new Error("Failed to load unit details");
                const uJson = await uRes.json();
                const u = uJson?.unit || {};
                setUnit({
                    id: unitId,
                    name: u?.unit_name || unit?.name,
                    property_id: u?.property_id,
                    rent_amount: u?.rent_amount,
                });

                // 2) Get property by property_id (fallback: keep URL name)
                const propId = u?.property_id || searchParams.get("propertyId");
                if (propId) {
                    const pRes = await fetch(`/api/propertyListing/getPropDetailsById?id=${propId}`);
                    if (pRes.ok) {
                        const pJson = await pRes.json();
                        const p = pJson?.property || {};
                        setProperty({
                            id: propId,
                            name: p?.property_name || property?.name,
                            address: p?.address || "",
                        });
                        setPercentageIncrease(p?.rent_increase_percent || "0"); // 🔹 store % increase

                    }
                }

                // 3) Get tenant by unit (for name/email displayed in lease)
                // const tRes = await fetch(`/api/tenant/getByUnit?unitId=${unitId}`);
                // if (tRes.ok) {
                //     const tJson = await tRes.json();
                //     setTenant((prev) => ({
                //         ...prev,
                //         name: tJson?.fullName || prev.name,
                //         email: tJson?.email || prev.email,
                //         phone: tJson?.phone || prev.phone,
                //     }));
                // }

            } catch (e: any) {
                setErr(e?.message || "Error loading details");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        const unitId = searchParams.get("unitId");
        if (!unitId) return;
        (async () => {
            try {
                const res = await fetch(`/api/properties/findRent/viewPropUnitDetails?rentId=${unitId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRentAmount(data?.unit?.rent_amount || "");
                }
            } catch (err) {
                console.error("Error fetching rent:", err);
            }
        })();
    }, [searchParams]);

    //  review
    useEffect(() => {
        if (step === 5) {
            setContent(
                buildLeaseTemplate({
                    lessorName: `${user?.lastName} ${user?.firstName}`,
                    tenantName: tenant?.name,
                    startDate,
                    endDate,
                    rentAmount,
                    depositAmount,
                    advanceAmount,
                    billingDueDay,
                    paymentMethods,
                    included,
                    excludedFees,
                    gracePeriod,
                    latePenalty,
                    otherPenalties,
                    maintenanceCharges,
                    occupancyLimit,
                    entryNoticeDays,
                    useOfProperty,
                    maintenanceResponsibility,
                    renewalOption,
                    percentageIncrease,
                })
            );
        }
    }, [step]);

    useEffect(() => {
        if (step === 6 && agreementId && envelopeId && user?.userType) {
            regenerateSignUrl(user.userType);
        }
    }, [step, agreementId, envelopeId, user?.userType]);

    useEffect(() => {
        const savedAgreement = localStorage.getItem("lease_agreement_id");
        const savedEnvelope = localStorage.getItem("lease_envelope_id");
        if (savedAgreement) setAgreementId(savedAgreement);
        if (savedEnvelope) setEnvelopeId(savedEnvelope);
    }, []);

    // ----- Validation -----
    const validateStep1 = () => {
        if (!tenant?.name) return "Tenant name is required.";
        if (!property?.name) return "Property name is required.";
        if (!unit?.name) return "Unit name is required.";
        if (!startDate) return "Start date is required.";
        if (!endDate) return "End date is required.";

        const s = new Date(startDate).getTime();
        const e = new Date(endDate).getTime();
        if (isNaN(s) || isNaN(e)) return "Invalid date(s).";
        if (e <= s) return "End date must be after start date.";

        return null;
    };

    const handleNext = () => {
        const message = validateStep1();
        if (message) {
            setErr(message);
            return;
        }
        setErr(null);
        setStep(2); // 👉 proceed to Step 2 (you’ll wire this next)
    };

    const handleGenerateLease = async () => {
        setLoading(true);
        try {
            // format penalties
            const formattedPenalties = otherPenalties.map(p => ({
                type: p.key,
                amount: p.amount,
            }));

            const res = await fetch("/api/leaseAgreement/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitId: searchParams.get("unitId"),
                    tenantId: searchParams.get("tenantId"),
                    content, // full contract HTML from Quill
                    startDate,
                    endDate,
                    rentAmount,
                    depositAmount,
                    advanceAmount,
                    billingDueDay,
                    paymentMethods,
                    included,
                    excludedFees,
                    gracePeriod,
                    latePenalty,
                    otherPenalties: formattedPenalties,
                    maintenanceCharges,
                    occupancyLimit,
                    entryNoticeDays,
                    useOfProperty,
                    maintenanceResponsibility,
                    renewalOption,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate lease");

            // set generated lease file url/base64 for signing
            setGeneratedFileUrl(data.signedUrl);
            setFileBase64(data.fileBase64);
            setAgreementId(data.agreementId);

            // fetch tenant email
            // if you already have agreementId
            const tenantRes = await fetch(
                `/api/tenant/getByUnit?agreementId=${data.agreementId}`
            );

            const tenantData = await tenantRes.json();

            console.log('tenant data: ', tenantData);

            if (!tenantData?.email) {
                alert("Tenant email is missing. Please update tenant details before sending for signing.");
                return;
            }

            await handleSendForSigning(
                data.fileBase64,
                tenantData?.email,
                data.agreementId
            );


            alert("Lease generated successfully!");
            setStep(6);
        } catch (err) {
            console.error(err);
            alert("Error generating lease.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendForSigning = async (
        fileBase64: string,
        tenantEmail: string,
        agreementId: string | number
    ) => {
        try {
            const res = await fetch("/api/leaseAgreement/generate/sendToDocuSign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agreementId,
                    landlordEmail: user?.email,
                    tenantEmail,
                    fileBase64,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setSignUrl(data.signUrl);
                setEnvelopeId(data.envelopeId);
                setAgreementId(String(agreementId));

                // 🔹 persist IDs in localStorage so they survive reloads
                localStorage.setItem("lease_agreement_id", String(agreementId));
                localStorage.setItem("lease_envelope_id", String(data.envelopeId));

                console.log("envelope id:", data.envelopeId);
                console.log("signed url:", data.signUrl);
            } else {
                console.error("DocuSign send failed:", data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const regenerateSignUrl = async (role: "landlord" | "tenant") => {
        if (!agreementId || !envelopeId) return;

        const res = await fetch("/api/leaseAgreement/signingUrl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                agreementId,
                envelopeId,
                role,
                landlordEmail: user?.email,
            }),
        });

        const data = await res.json();
        if (res.ok) {
            setSignUrl(data.url);
        } else {
            console.error("Failed to regenerate signing link:", data);
        }
    };
    // ----- UI -----
    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-6">Lease Agreement Wizard</h1>

            {/* Step indicator */}
            <div className="flex flex-wrap gap-2 mb-6">
                {["1. Property & Tenant", "2. Financial Terms", "3. Penalties", "4. Maintenance & Rules", "5. Review", "6. Sign"].map(
                    (label, i) => (
                        <span
                            key={label}
                            className={`px-3 py-1 rounded-full text-sm ${
                                step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                            }`}
                        >
              {label}
            </span>
                    )
                )}
            </div>
            <button
                type="button"
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700"
                onClick={handleCancel}
            >
                Cancel
            </button>
            {/* ====== STEP 1: Property & Tenant Details ====== */}
            {step === 1 && (
                <div className="space-y-6">
                    {loading && (
                        <div className="p-3 text-sm bg-blue-50 border border-blue-200 rounded">
                            Loading property, unit, and tenant details…
                        </div>
                    )}
                    {err && (
                        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded">
                            {err}
                        </div>
                    )}

                    {/* Tenant */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Tenant</h2>
                        <label className="block text-sm mb-1">Tenant Name (for contract)</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={tenant.name || ""}
                            onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                            placeholder="e.g., Juan Dela Cruz"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                                <label className="block text-sm mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={tenant.email || ""}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Phone</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={tenant.phone || ""}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property & Unit */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Property & Unit</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1">Property</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={property.name || ""}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Unit</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={unit.name || ""}
                                    readOnly
                                />
                            </div>
                        </div>
                        {property.address ? (
                            <div className="mt-3">
                                <label className="block text-sm mb-1">Address</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={property.address}
                                    readOnly
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Lease Dates */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Lease Dates</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Tip: You can still adjust these before generating the contract.
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Renewal Terms</h2>

                        <label className="block mb-2">
                            Renewal Option
                            <select
                                className="w-full border rounded p-2"
                                value={renewalOption}
                                onChange={(e) => setRenewalOption(e.target.value)}
                            >
                                {RENEWAL_OPTIONS.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {renewalOption === "optional_notice" && (
                            <label className="block mt-3">
                                Notice Period (days before end date)
                                <input
                                    type="number"
                                    className="w-full border rounded p-2"
                                    value={renewalNoticeDays}
                                    onChange={(e) => setRenewalNoticeDays(e.target.value)}
                                />
                            </label>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700"
                            onClick={() => {
                                // optional: reset fields
                                setStartDate("");
                                setEndDate("");
                            }}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white"
                            onClick={handleNext}
                        >
                            Next: Financial Terms
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 2: Financial Terms ====== */}
            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Financial Terms</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Define the rent, deposits, payment method, and what’s included in rent.
                    </p>

                    {/* Monthly Rent */}
                    <label className="block">
                        Monthly Rent (₱)
                        <input
                            type="number"
                            className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                            value={rentAmount}
                            readOnly
                        />
                    </label>

                    {/* Deposit / Advance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            Security Deposit (₱)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                            />
                        </label>
                        <label className="block">
                            Advance Payment (₱)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={advanceAmount}
                                onChange={(e) => setAdvanceAmount(e.target.value)}
                            />
                        </label>
                    </div>

                    {/* Billing Due Date */}
                    <label className="block">
                        Billing Due Day
                        <select
                            className="w-full border rounded p-2"
                            value={billingDueDay}
                            onChange={(e) => setBillingDueDay(e.target.value)}
                        >
                            {Array.from({ length: 31 }, (_, i) => (
                                <option key={i} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select the day of the month rent is due.
                        </p>
                    </label>

                    {/* Percentage Increase on Renewal */}
                    <label className="block">
                        Rent Increase on Renewal (%)
                        <input
                            type="number"
                            className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                            value={percentageIncrease}
                            readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This percentage increase is automatically applied upon renewal.
                            It is set at the property level during property creation and cannot be changed here.
                        </p>
                    </label>


                    {/* Payment Methods */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">
                            Accepted Payment Methods
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map((pm) => (
                                <label key={pm.key} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={pm.key}
                                        checked={paymentMethods.includes(pm.key)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setPaymentMethods([...paymentMethods, pm.key]); // add
                                            } else {
                                                setPaymentMethods(paymentMethods.filter((x) => x !== pm.key)); // remove
                                            }
                                        }}
                                    />
                                    <span>{pm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Inclusions */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Included in Rent</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {RENT_INCLUSIONS.map((inc) => (
                                <label key={inc.value} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={included.includes(inc.value)}
                                        onChange={(e) =>
                                            setIncluded(
                                                e.target.checked
                                                    ? [...included, inc.value]
                                                    : included.filter((x) => x !== inc.value)
                                            )
                                        }
                                    />
                                    <span>{inc.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Excluded from Rent (Recurring Fees) */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">
                            Excluded from Rent (Recurring Fees)
                        </h3>
                        {excludedFees.length === 0 && (
                            <p className="text-sm text-gray-500 mb-2">
                                No excluded fees added yet. Click below to add one.
                            </p>
                        )}
                        {excludedFees.map((fee, i) => (
                            <div key={i} className="flex items-center space-x-3 mb-3">
                                {/* Fee Type Dropdown */}
                                <select
                                    value={fee.key}
                                    onChange={(e) =>
                                        handleExcludedFeeChange(i, "key", e.target.value)
                                    }
                                    className="w-1/2 border rounded p-2"
                                >
                                    <option value="">Select Fee</option>
                                    {EXTRA_EXPENSES.map((opt) => (
                                        <option key={opt.key} value={opt.key}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Amount */}
                                <input
                                    type="number"
                                    placeholder="₱ Amount"
                                    value={fee.amount}
                                    onChange={(e) =>
                                        handleExcludedFeeChange(i, "amount", e.target.value)
                                    }
                                    className="w-1/3 border rounded p-2"
                                />

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExcludedFee(i)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddExcludedFee}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            + Add Excluded Fee
                        </button>
                    </div>


                    {/* Actions */}
                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(1)}
                            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next: Penalties
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 3: Penalties ====== */}
            {step === 3 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Penalty Terms</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Define grace period, late penalty, and add other penalties if applicable.
                    </p>

                    {/* Grace Period & Late Penalty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            Grace Period (days)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={gracePeriod}
                                onChange={(e) => setGracePeriod(e.target.value)}
                            />
                        </label>
                        <label className="block">
                            Late Penalty (₱/day)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={latePenalty}
                                onChange={(e) => setLatePenalty(e.target.value)}
                            />
                        </label>
                    </div>

                    {/* Other Penalties */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">
                            Other Penalties
                        </h3>
                        {otherPenalties.map((p, i) => (
                            <div key={i} className="flex items-center space-x-3 mb-3">
                                {/* Penalty Type Dropdown */}
                                <select
                                    value={p.key}
                                    onChange={(e) =>
                                        handlePenaltyChange(i, "key", e.target.value)
                                    }
                                    className="w-1/2 border rounded p-2"
                                >
                                    <option value="">Select Penalty</option>
                                    {PENALTY_TYPES.map((opt) => (
                                        <option key={opt.key} value={opt.key}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Penalty Amount */}
                                <input
                                    type="number"
                                    placeholder="₱ Amount"
                                    value={p.amount}
                                    onChange={(e) =>
                                        handlePenaltyChange(i, "amount", e.target.value)
                                    }
                                    className="w-1/3 border rounded p-2"
                                />

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemovePenalty(i)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddPenalty}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            + Add Penalty
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setStep(2)}
                            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(4)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next: Maintenance
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 4: Maintenance & Other Charges ====== */}
            {step === 4 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Maintenance & Other Charges</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Add recurring charges that are billed separately from rent (e.g., garbage, security, HOA dues).
                    </p>

                    {maintenanceCharges.length === 0 && (
                        <p className="text-sm text-gray-500 mb-2">
                            No maintenance charges added yet. Click below to add one.
                        </p>
                    )}

                    {maintenanceCharges.map((m, i) => (
                        <div key={i} className="flex items-center space-x-3 mb-3">
                            {/* Charge Type Dropdown */}
                            <select
                                value={m.key}
                                onChange={(e) => handleMaintenanceChange(i, "key", e.target.value)}
                                className="w-1/2 border rounded p-2"
                            >
                                <option value="">Select Charge</option>
                                {MAINTENANCE_CHARGES.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Amount */}
                            <input
                                type="number"
                                placeholder="₱ Amount"
                                value={m.amount}
                                onChange={(e) => handleMaintenanceChange(i, "amount", e.target.value)}
                                className="w-1/3 border rounded p-2"
                            />

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveMaintenance(i)}
                                className="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddMaintenance}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                        + Add Maintenance Charge
                    </button>

                    {/* ====== Rules Section ====== */}
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Rules & Conditions</h2>

                        {/* Occupancy Limit */}
                        <label className="block">
                            Occupancy Limit
                            <input
                                type="number"
                                className="w-full border rounded p-2 mt-1"
                                value={occupancyLimit}
                                onChange={(e) => setOccupancyLimit(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum number of people allowed to occupy the property.
                            </p>
                        </label>

                        {/* Entry Rights */}
                        <label className="block">
                            Entry Rights (Notice Period in Hours)
                            <input
                                type="number"
                                className="w-full border rounded p-2 mt-1"
                                value={entryNoticeDays}
                                onChange={(e) => setEntryNoticeDays(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Number of hours’ notice required before landlord entry.
                            </p>
                        </label>

                        {/* Use of Property */}
                        <label className="block">
                            Use of Property
                            <select
                                className="w-full border rounded p-2 mt-1"
                                value={useOfProperty}
                                onChange={(e) => setUseOfProperty(e.target.value)}
                            >
                                {USE_OF_PROPERTY.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Maintenance & Repairs */}
                        <label className="block">
                            Maintenance & Repairs
                            <select
                                className="w-full border rounded p-2 mt-1"
                                value={maintenanceResponsibility}
                                onChange={(e) => setMaintenanceResponsibility(e.target.value)}
                            >
                                {MAINTENANCE_RESPONSIBILITY.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>


                    {/* Actions */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setStep(3)}
                            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(5)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next: Review
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 5: Review & Generate ====== */}
            {step === 5 && (
                <div>
                    <ReactQuill
                        value={content}
                        onChange={setContent}
                        theme="snow"
                        style={{ minHeight: "400px" }}
                    />

                    <div className="flex justify-between mt-6">
                        {/* Reset Button */}
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                            onClick={() =>
                                setContent(
                                    buildLeaseTemplate({
                                        lessorName: `${user?.lastName} ${user?.firstName}`,
                                        tenantName: tenant?.name,
                                        startDate,
                                        endDate,
                                        rentAmount,
                                        depositAmount,
                                        advanceAmount,
                                        billingDueDay,
                                        paymentMethods,
                                        included,
                                        excludedFees,
                                        gracePeriod,
                                        latePenalty,
                                        otherPenalties,
                                        maintenanceCharges,
                                        occupancyLimit,
                                        entryNoticeDays,
                                        useOfProperty,
                                        maintenanceResponsibility,
                                        renewalOption,
                                    })
                                )
                            }
                        >
                            Reset to Default Contract
                        </button>

                        {/* Generate Lease Button */}
                        <button
                            type="button"
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            onClick={handleGenerateLease}
                        >
                            Generate Lease
                        </button>
                    </div>
                </div>
            )}

            {step === 6 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        ✍️ Ready to Sign?
                    </h2>

                    <button
                        onClick={() => {
                            localStorage.removeItem(STORAGE_KEY);
                            localStorage.removeItem("lease_agreement_id");
                            localStorage.removeItem("lease_envelope_id");

                            // 🔹 Redirect to signing page
                            router.push(`/pages/lease/signing?agreementId=${agreementId}&envelopeId=${envelopeId}`);
                        }}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Go to Signing Page →
                    </button>
                </div>
            )}
        </div>
    );
}
