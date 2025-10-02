
"use client";
import { useState, useEffect } from "react";
import { ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import TextField from "@mui/material/TextField";
import { EXTRA_EXPENSES } from "@/constant/extraExpenses";
import { PAYMENT_METHODS } from "@/constant/paymentMethods";
import { RENT_INCLUSIONS } from "@/constant/rentInclusions";
import { useRouter } from "next/navigation";
import { PENALTY_TYPES } from "@/constant/penaltyTypes";
import Swal from "sweetalert2";

export default function LeaseScanPage({ params }: { params: { unitId: string } }) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [localPayload, setLocalPayload] = useState<any>(null);
    const [unitData, setUnitData] = useState<any>(null);
    // 🔹 Extra financial terms state
    const [advancePayment, setAdvancePayment] = useState("");
    const [billingDueDay, setBillingDueDay] = useState("1");
    const [percentageIncrease, setPercentageIncrease] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
    const [included, setIncluded] = useState<string[]>([]);
    const [excludedFees, setExcludedFees] = useState<{ key: string; amount: string }[]>([]);
    const router = useRouter();
    const [penalties, setPenalties] = useState<
        { type: string; amount: string; customLabel?: string }[]
    >([]);

    useEffect(() => {
        const saved = localStorage.getItem("lease_upload_payload");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setLocalPayload(parsed);
                console.log("Loaded payload for upload lease:", parsed);
            } catch {}
        }
    }, []);

    useEffect(() => {
        if (analysis?.penalties && Array.isArray(analysis.penalties)) {
            setPenalties(analysis.penalties.map((p: any) => ({
                type: p.type,
                amount: p.amount || ""
            })));
        }
    }, [analysis]);

    // Restore file from localStorage on mount
    useEffect(() => {
        const savedMeta = localStorage.getItem("lease_file_meta");
        const savedData = localStorage.getItem("lease_file_data");
        if (savedMeta && savedData) {
            const meta = JSON.parse(savedMeta);
            const byteString = atob(savedData.split(",")[1]);
            const mimeString = savedData.split(",")[0].split(":")[1].split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const restoredFile = new File([ab], meta.name, { type: mimeString });
            setFile(restoredFile);
        }
    }, []);

    // Fetch unit data on mount
    useEffect(() => {
        async function fetchUnit() {
            try {
                const uRes = await fetch(`/api/properties/findRent/viewPropUnitDetails?rentId=${params.unitId}`);
                if (!uRes.ok) throw new Error("Failed to load unit details");
                const uJson = await uRes.json();
                const u = uJson?.unit || {};
                setUnitData({
                    id: params.unitId,
                    name: u?.unit_name,
                    property_id: u?.property_id,
                    rent_amount: u?.rent_amount,
                });
            } catch (err) {
                console.error("Failed to fetch unit details:", err);
            }
        }
        fetchUnit();
    }, [params.unitId]);

    // Persist file to localStorage when it changes
    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    localStorage.setItem("lease_file_data", e.target.result as string);
                    localStorage.setItem(
                        "lease_file_meta",
                        JSON.stringify({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                        })
                    );
                }
            };
            reader.readAsDataURL(file);
        } else {
            localStorage.removeItem("lease_file_data");
            localStorage.removeItem("lease_file_meta");
        }
    }, [file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf") {
                setFile(droppedFile);
            } else {
                alert("Please drop a PDF file.");
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleUploadAndScan = async () => {
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append("leaseFile", file); // still use this for scanning
        formData.append("unit_id", params.unitId);

        try {
            const res = await fetch("/api/leaseAgreement/analyzeLease", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            setIsLoading(false);

            if (!data.success) {
                alert(data.error || "Failed to analyze lease. Please try again.");
                return;
            }

            if (data.analysis && Object.keys(data.analysis).length > 0) {
                // ✅ keep the file in state for later steps
                setFile(file);
                setAnalysis(data.analysis);
                setStep(2);
            } else {
                alert("⚠️ No usable lease details were extracted from this document.");
            }
        } catch (err) {
            console.error("Upload & scan failed:", err);
            setIsLoading(false);
            alert("Something went wrong while scanning the lease.");
        }
    };

    const handleAddExcludedFee = () => setExcludedFees([...excludedFees, { key: "", amount: "" }]);
    const handleExcludedFeeChange = (index: number, field: string, value: string) => {
        const updated = [...excludedFees];
        // @ts-ignore
        updated[index][field] = value;
        setExcludedFees(updated);
    };
    const handleRemoveExcludedFee = (index: number) =>
        setExcludedFees(excludedFees.filter((_, i) => i !== index));

    const handleAddPenalty = () => {
        setPenalties([...penalties, { type: "", amount: "" }]);
    };

    const handlePenaltyChange = (index: number, field: string, value: string) => {
        const updated = [...penalties];
        // @ts-ignore
        updated[index][field] = value;
        setPenalties(updated);
    };

    const handleRemovePenalty = (index: number) => {
        setPenalties(penalties.filter((_, i) => i !== index));
    };

    const handleSaveAndContinue = async () => {
        try {
            if (!analysis?.signatureOption) {
                Swal.fire({
                    icon: "warning",
                    title: "Missing Signature Option",
                    text: "Please select a signature option before proceeding.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                });
                return;
            }
            if (!analysis?.startDate || !analysis?.endDate) {
                Swal.fire({
                    icon: "warning",
                    title: "Missing Dates",
                    text: "Start and End dates are required.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                });
                return;
            }
            if (!file) {
                Swal.fire({
                    icon: "warning",
                    title: "Missing File",
                    text: "Please ensure a lease file is uploaded.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                });
                return;
            }

            // Show loading alert
            Swal.fire({
                title: "Submitting...",
                text: "Please wait while we process your lease agreement.",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const payload = {
                unitId: params.unitId,
                tenantName: localPayload?.tenantName || null,
                landlordName: localPayload?.landlordName || null,
                propertyAddress: localPayload?.propertyName || null,
                unitName: localPayload?.unitName || null,
                startDate: analysis?.startDate,
                endDate: analysis?.endDate,
                securityDeposit: analysis?.securityDeposit,
                advancePayment,
                billingDueDay,
                gracePeriod: analysis?.gracePeriod,
                latePenaltyAmount: analysis?.latePenaltyAmount,
                included,
                paymentMethods,
                excludedFees,
                penalties,
                renewalTerms: analysis?.renewalTerms || null,
                currency: analysis?.currency || "PHP",
                signatureOption: analysis?.signatureOption,
            };

            const formData = new FormData();
            for (const [key, value] of Object.entries(payload)) {
                if (Array.isArray(value) || typeof value === "object") {
                    formData.append(key, JSON.stringify(value));
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value as any);
                }
            }

            formData.append("leaseFile", file);

            const res = await fetch("/api/leaseAgreement/uploadUnitLease", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                console.error("Save failed:", data.error || data.message);
                Swal.fire({
                    icon: "error",
                    title: "Save Failed",
                    text: data.error || "Failed to save lease details. Please try again.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                });
                return;
            }

            // Show success alert
            Swal.fire({
                icon: "success",
                title: "Success",
                text: "Lease uploaded successfully!",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });

            console.log("Lease saved successfully:", data);
            // Clear localStorage after successful save
            localStorage.removeItem("lease_file_data");
            localStorage.removeItem("lease_file_meta");
            router.push(`/pages/landlord/property-listing/view-unit/${unitData.property_id}/unit-details/${params.unitId}`);

        } catch (err) {
            console.error("Error in Save & Finish:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Something went wrong while saving the lease.",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Lease Agreement Upload </h1>

            {/* Step Indicator */}
            <div className="flex items-center mb-6 space-x-4">
                {["Step 1. Upload Document", "Step 2. Lease Dates & Basics", "Step 3. Financial Terms", "Step 4. Signature"].map(
                    (label, index) => (
                        <div
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                step === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {label}
                        </div>
                    )
                )}
            </div>

            {/* Step 1: Upload & Scan */}
            {step === 1 && (
                <div className="space-y-6">
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="leaseFileInput"
                        />
                        <label htmlFor="leaseFileInput" className="cursor-pointer block">
                            <p className="text-lg">📄 Drag & drop lease PDF here, or click to select</p>
                        </label>
                        {file && (
                            <div className="mt-4">
                                <p>Selected: {file.name}</p>
                                <button onClick={() => setFile(null)} className="text-red-500">Remove</button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleUploadAndScan}
                        disabled={!file || isLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                Scanning Lease...
                            </>
                        ) : (
                            <>
                                <DocumentTextIcon className="h-5 w-5" />
                                Scan Document
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Step 2: Dates & Basic Rent */}
            {step === 2 && analysis && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">📑 Lease Dates & Basic Terms</h2>

                    {/* Header */}
                    <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                        <p className="text-sm text-gray-600">
                            <strong>Tenant:</strong> {localPayload?.tenantName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Property:</strong> {localPayload?.propertyName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Unit:</strong> {localPayload?.unitName || "N/A"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            value={analysis.startDate || ""}
                            onChange={(e) => setAnalysis({ ...analysis, startDate: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            value={analysis.endDate || ""}
                            onChange={(e) => setAnalysis({ ...analysis, endDate: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <div>
                            <TextField
                                label="Monthly Rent (₱)"
                                type="number"
                                size="small"
                                value={unitData.rent_amount || ""}
                                onChange={(e) => setAnalysis({ ...analysis, monthlyRent: e.target.value })}
                                fullWidth
                            />
                            {analysis.monthlyRent && unitData && parseFloat(analysis.monthlyRent) !== parseFloat(unitData.rent_amount) && (
                                <p className="text-red-500 text-xs mt-1">
                                    Warning: There is a discrepancy between the scanned rent (₱{analysis.monthlyRent}) and the unit's set rent (₱{unitData.rent_amount}). The rent amount set in the unit will prevail not in the lease.
                                </p>
                            )}
                        </div>
                        <TextField
                            label="Security Deposit (₱)"
                            type="number"
                            size="small"
                            value={analysis.securityDeposit || ""}
                            onChange={(e) => setAnalysis({ ...analysis, securityDeposit: e.target.value })}
                            fullWidth
                        />

                        <TextField
                            label="Advance Payment (₱)"
                            type="number"
                            size="small"
                            value={advancePayment}
                            onChange={(e) => setAdvancePayment(e.target.value)}
                            fullWidth
                        />

                    </div>

                    {/* Navigation */}
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => {
                                setStep(1);
                                setAnalysis(null);
                                setFile(null);
                            }}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Financial Terms */}
            {step === 3 && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Financial Terms</h2>

                    <div className="space-y-4">
                        {/* Billing Due Day */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Billing Due Day</label>
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
                                The day of the month when rent is due.
                            </p>
                        </div>

                        {/* Grace Period */}
                        <div>
                            <TextField
                                label="Grace Period (days)"
                                type="number"
                                size="small"
                                value={analysis?.gracePeriod || ""}
                                onChange={(e) => setAnalysis({ ...analysis, gracePeriod: e.target.value })}
                                fullWidth
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Number of days before late fees apply.
                            </p>
                        </div>

                        {/* Late Penalty */}
                        <div>
                            <TextField
                                label="Late Penalty Per Day (₱)"
                                type="number"
                                size="small"
                                value={analysis?.latePenaltyAmount || ""}
                                onChange={(e) => setAnalysis({ ...analysis, latePenaltyAmount: e.target.value })}
                                fullWidth
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Penalty charged per day after the grace period ends.
                            </p>
                        </div>

                        {/* Other Penalties */}
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Other Penalties</h3>

                            {penalties.map((pen, i) => (
                                <div key={i} className="flex items-center gap-2 mb-2">
                                    {/* Dropdown */}
                                    <select
                                        value={PENALTY_TYPES.find((p) => p.value === pen.type) ? pen.type : "other"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === "other") {
                                                handlePenaltyChange(i, "type", pen.type || "");
                                            } else {
                                                handlePenaltyChange(i, "type", value);
                                            }
                                        }}
                                        className="w-1/3 border rounded p-2"
                                    >
                                        <option value="">Select Penalty</option>
                                        {PENALTY_TYPES.map((p) => (
                                            <option key={p.value} value={p.value}>
                                                {p.label}
                                            </option>
                                        ))}
                                        <option value="other">Other (Specify)</option>
                                    </select>

                                    {/* Custom label if not in PENALTY_TYPES */}
                                    {!PENALTY_TYPES.find((p) => p.value === pen.type) && (
                                        <input
                                            type="text"
                                            placeholder="Custom Penalty"
                                            value={pen.type}
                                            onChange={(e) => handlePenaltyChange(i, "type", e.target.value)}
                                            className="flex-1 border rounded p-2"
                                        />
                                    )}

                                    {/* Amount input */}
                                    <input
                                        type="number"
                                        placeholder="₱ Amount"
                                        value={pen.amount}
                                        onChange={(e) => handlePenaltyChange(i, "amount", e.target.value)}
                                        className="w-1/4 border rounded p-2"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => handleRemovePenalty(i)}
                                        className="text-red-500"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddPenalty}
                                className="text-blue-600 text-sm"
                            >
                                + Add Penalty
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setStep(2)}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(4)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">✍️ Signature Options</h2>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="signatureOption"
                                value="signed"
                                checked={analysis?.signatureOption === "signed"}
                                onChange={() => setAnalysis({ ...analysis, signatureOption: "signed" })}
                            />
                            Lease is already signed
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="signatureOption"
                                value="docusign"
                                checked={analysis?.signatureOption === "docusign"}
                                onChange={() => setAnalysis({ ...analysis, signatureOption: "docusign" })}
                            />
                            Lease is not signed — Upload draft for digital signing
                        </label>

                    </div>

                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setStep(3)}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSaveAndContinue}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Save & Finish
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}