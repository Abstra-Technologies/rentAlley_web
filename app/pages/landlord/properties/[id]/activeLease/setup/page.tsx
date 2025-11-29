"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    FileUp,
    FileEdit,
    ArrowLeft,
    Loader2,
    FileText,
    FileCheck,
    Upload,
    ClipboardList,
} from "lucide-react";
import { formatDate } from "@/utils/formatter/formatters";
import GenerateLease from "./GenerateLease"; 

export default function SetupLeasePage() {
    const router = useRouter();
    const params = useParams();
    const property_id = params.id as string;
    const searchParams = useSearchParams();
    const agreement_id = searchParams.get("agreement_id");

    const [leaseDetails, setLeaseDetails] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedMode, setSelectedMode] = useState<"upload" | "generate" | null>(
        null
    );
    const STORAGE_KEY = `lease_setup_${agreement_id}`;

    useEffect(() => {
        if (!agreement_id) return;

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed.step) setStep(parsed.step);
            if (parsed.selectedMode) setSelectedMode(parsed.selectedMode);
        }
    }, [agreement_id]);


    useEffect(() => {
        if (!agreement_id) return;

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                step,
                selectedMode,
            })
        );
    }, [step, selectedMode, agreement_id]);


    useEffect(() => {
        if (!agreement_id) return;
        const fetchLeaseDetails = async () => {
            try {
                const res = await axios.get(`/api/landlord/activeLease/getByAgreementId`, {
                    params: { agreement_id },
                });
                setLeaseDetails(res.data || {});
            } catch (error) {
                Swal.fire("Error", "Failed to load lease details.", "error");
            }
        };
        fetchLeaseDetails();
    }, [agreement_id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
    };

    // only for upoad setup only.
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
            Swal.fire("Missing File", "Please upload the lease agreement document.", "warning");
            return;
        }

        const formData = new FormData(e.currentTarget);

        formData.append("agreement_id", agreement_id!);
        formData.append("property_id", property_id as string);
        formData.append("lease_file", file);

        if (leaseDetails) {
            formData.append("tenant_id", leaseDetails.tenant_id);
            formData.append("landlord_id", leaseDetails.landlord_id);
        }

        const start_date = formData.get("start_date");
        const end_date = formData.get("end_date");
        if (!start_date || !end_date) {
            Swal.fire("Incomplete", "Please provide lease start and end dates.", "warning");
            return;
        }

        setIsUploading(true);
        try {
            const res = await axios.post(`/api/landlord/activeLease/uploadLease`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire({
                title: "Success",
                text: "Lease document and details uploaded successfully!",
                icon: "success",
                confirmButtonColor: "#059669",
            });

            // Redirect to active lease view
            router.push(`/pages/landlord/properties/${property_id}/activeLease`);
        } catch (error: any) {
            console.error("Upload error:", error);
            const errMsg =
                error.response?.data?.message ||
                "There was a problem uploading the lease document. Please try again later.";
            Swal.fire("Upload Failed", errMsg, "error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        Setup Lease Agreement
                    </h1>
                </div>
            </div>

            {/* Step 1: Choose Mode */}
            {step === 1 && (
                <div className="flex flex-col items-center justify-center">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                        Step 1: Choose how to set up your lease
                    </h2>
                    <p className="text-gray-500 text-sm mb-6 text-center">
                        You can either upload an existing signed document or generate a new one using UpKyp’s guided system.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
                        {/* Upload Option */}
                        <div
                            onClick={() => setSelectedMode("upload")}
                            className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                                selectedMode === "upload"
                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                    : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                        >
                            <FileUp className={`w-10 h-10 mb-3 ${selectedMode === "upload" ? "text-blue-600" : "text-gray-400"}`} />
                            <h3 className="font-semibold text-gray-800 mb-1">Upload Existing Lease</h3>
                            <p className="text-sm text-gray-500">If you already have a signed agreement, upload it here.</p>
                        </div>

                        {/* Generate Option */}
                        <div
                            onClick={() => setSelectedMode("generate")}
                            className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                                selectedMode === "generate"
                                    ? "border-emerald-500 bg-emerald-50 shadow-md"
                                    : "border-gray-200 bg-white hover:border-emerald-300"
                            }`}
                        >
                            <FileEdit className={`w-10 h-10 mb-3 ${selectedMode === "generate" ? "text-emerald-600" : "text-gray-400"}`} />
                            <h3 className="font-semibold text-gray-800 mb-1">Generate Lease</h3>
                            <p className="text-sm text-gray-500">Use UpKyp’s guided generator to create a new lease.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!selectedMode}
                        className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition disabled:opacity-50 shadow"
                    >
                        Continue →
                    </button>
                </div>
            )}

            {/* Step 2 - Uppload only */}
            {step === 2 && selectedMode === "upload" && (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" /> Upload Lease Document
                    </h2>

                    {/* Lease Info Summary */}
                    <div className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-xl">
                        <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-blue-600" /> Tenant & Lease Information
                        </h3>
                        {leaseDetails ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                                <p><span className="font-medium text-gray-800">Tenant:</span> {leaseDetails.tenant_name || "N/A"}</p>
                                <p><span className="font-medium text-gray-800">Email:</span> {leaseDetails.tenant_email || "N/A"}</p>
                                <p><span className="font-medium text-gray-800">Unit:</span> {leaseDetails.unit_name || "N/A"}</p>
                                <p><span className="font-medium text-gray-800">Property:</span> {leaseDetails.property_name || "N/A"}</p>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">Loading tenant details...</p>
                        )}
                    </div>

                    {/* Editable Lease Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lease End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₱)</label>
                            <input
                                type="number"
                                name="rent_amount"
                                min="0"
                                step="0.01"
                                defaultValue={leaseDetails?.rent_amount || ""}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₱)</label>
                            <input
                                type="number"
                                name="security_deposit"
                                min="0"
                                step="0.01"
                                defaultValue={leaseDetails?.security_deposit || ""}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment (₱)</label>
                            <input
                                type="number"
                                name="advance_payment"
                                min="0"
                                step="0.01"
                                defaultValue={leaseDetails?.advance_payment || ""}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                        <label className="flex flex-col items-center justify-center w-full sm:w-1/2 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                            <div className="flex flex-col items-center justify-center text-gray-600">
                                <Upload className="w-8 h-8 text-blue-500 mb-2" />
                                <span className="text-sm font-medium">
                        {file ? file.name : "Click to upload or drag file here"}
                    </span>
                                <span className="text-xs text-gray-400 mt-1">Supported: PDF, DOCX</span>
                            </div>
                            <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
                        </label>

                        {file && (
                            <div className="flex flex-col items-center justify-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg w-full sm:w-1/2">
                                <FileCheck className="w-6 h-6 text-emerald-600 mb-1" />
                                <p className="text-sm font-medium text-gray-700 text-center">{file.name}</p>
                                <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                            </div>
                        )}
                    </div>

                    {/* Page_footer Buttons */}
                    <div className="mt-6 flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-emerald-700 transition disabled:opacity-50"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" /> Submit Agreement
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}



            {step === 2 && selectedMode === "generate" && (
                <GenerateLease property_id={property_id} agreement_id={agreement_id} leaseDetails={leaseDetails} />
            )}
        </div>
    );
}
