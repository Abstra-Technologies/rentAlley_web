
"use client";
import { useState } from "react";
import { ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import TextField from "@mui/material/TextField";

export default function LeaseScanPage({ params }: { params: { unitId: string } }) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadAndScan = async () => {
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append("leaseFile", file);
        formData.append("unit_id", params.unitId);

        const res = await fetch("/api/leaseAgreement/analyzeLease", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        setAnalysis(data.analysis);
        setIsLoading(false);

        if (data.success) setStep(2);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Lease Agreement Upload </h1>

            {/* Step Indicator */}
            <div className="flex items-center mb-6 space-x-4">
                {["Step 1. Upload Document", "Step 2. Review Information"].map((label, index) => (
                    <div
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                            step === index + 1
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Step 1: Upload & Scan */}
            {step === 1 && (
                <div className="space-y-6">
                    {/* File Picker */}
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="mb-4"
                    />

                    {/* Upload & Scan Button */}
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
                                Upload & Scan
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Step 2: Results */}

            {step === 2 && analysis && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        📑 Review Extracted Lease Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            label="Tenant Name"
                            variant="outlined"
                            size="small"
                            value={analysis.tenantName || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, tenantName: e.target.value })
                            }
                            fullWidth
                        />

                        <TextField
                            label="Landlord Name"
                            variant="outlined"
                            size="small"
                            value={analysis.landlordName || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, landlordName: e.target.value })
                            }
                            fullWidth
                        />

                        <TextField
                            label="Property Address"
                            variant="outlined"
                            size="small"
                            value={analysis.propertyAddress || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, propertyAddress: e.target.value })
                            }
                            fullWidth
                            className="md:col-span-2"
                        />

                        <TextField
                            label="Start Date"
                            type="date"
                            variant="outlined"
                            size="small"
                            value={analysis.startDate || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, startDate: e.target.value })
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="End Date"
                            type="date"
                            variant="outlined"
                            size="small"
                            value={analysis.endDate || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, endDate: e.target.value })
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Monthly Rent (₱)"
                            type="number"
                            variant="outlined"
                            size="small"
                            value={analysis.monthlyRent || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, monthlyRent: e.target.value })
                            }
                            fullWidth
                        />

                        <TextField
                            label="Security Deposit (₱)"
                            type="number"
                            variant="outlined"
                            size="small"
                            value={analysis.securityDeposit || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, securityDeposit: e.target.value })
                            }
                            fullWidth
                        />

                        <TextField
                            label="Renewal Terms"
                            variant="outlined"
                            size="small"
                            value={analysis.renewalTerms || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, renewalTerms: e.target.value })
                            }
                            fullWidth
                            className="md:col-span-2"
                        />

                        <TextField
                            label="Penalties"
                            variant="outlined"
                            size="small"
                            value={analysis.penalties || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, penalties: e.target.value })
                            }
                            fullWidth
                            className="md:col-span-2"
                        />

                        <TextField
                            label="Currency"
                            variant="outlined"
                            size="small"
                            value={analysis.currency || ""}
                            onChange={(e) =>
                                setAnalysis({ ...analysis, currency: e.target.value })
                            }
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
                    </div>
                </div>
            )}



        </div>
    );
}

