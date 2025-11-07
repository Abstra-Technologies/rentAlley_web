"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    FileText,
    Upload,
    ArrowLeft,
    FileCheck,
    Loader2,
    ClipboardList,
    FileEdit,
    FileUp,
} from "lucide-react";
import { formatDate } from "@/utils/formatter/formatters";

export default function SetupLeasePage() {
    const router = useRouter();
    const params = useParams();
    const property_id = params.id as string;
    const searchParams = useSearchParams();
    const agreement_id = searchParams.get("agreement_id");

    const [leaseDetails, setLeaseDetails] = useState(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedMode, setSelectedMode] = useState<"upload" | "generate" | null>(
        null
    );

    useEffect(() => {
        if (!agreement_id) return;

        const fetchLeaseDetails = async () => {
            try {
                const res = await axios.get(`/api/landlord/activeLease/getById`, {
                    params: { agreement_id },
                });
                setLeaseDetails(res.data || {});
            } catch (error) {
                console.error("❌ Error fetching lease:", error);
                Swal.fire("Error", "Failed to load lease details.", "error");
            }
        };

        fetchLeaseDetails();
    }, [agreement_id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            Swal.fire(
                "Missing File",
                "Please upload the lease agreement document.",
                "warning"
            );
            return;
        }

        const formData = new FormData();
        formData.append("agreement_id", agreement_id!);
        formData.append("property_id", property_id as string);
        formData.append("lease_file", file);

        setIsUploading(true);

        try {
            await axios.post(`/api/landlord/activeLease/uploadLease`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire({
                title: "Success",
                text: "Lease agreement uploaded successfully!",
                icon: "success",
                confirmButtonColor: "#059669",
            });

            router.push(`/pages/landlord/properties/${property_id}/activeLease`);
        } catch (error) {
            console.error("❌ Upload error:", error);
            Swal.fire("Upload Failed", "Please try again later.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleContinue = () => {
        if (selectedMode === "upload") {
            setStep(2);
        } else if (selectedMode === "generate") {
            router.push(
                `/pages/landlord/properties/${property_id}/activeLease/setup/generate?agreement_id=${agreement_id}`
            );
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
                        You can either upload an existing signed document or generate a
                        new one using UpKyp’s built-in template system.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
                        {/* Upload Option */}
                        <div
                            onClick={() => setSelectedMode("upload")}
                            className={`cursor-pointer rounded-2xl border-2 transition-all duration-200 p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md
                ${
                                selectedMode === "upload"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                        >
                            <FileUp
                                className={`w-10 h-10 mb-3 ${
                                    selectedMode === "upload" ? "text-blue-600" : "text-gray-400"
                                }`}
                            />
                            <h3 className="font-semibold text-gray-800 mb-1">
                                Upload Existing Lease
                            </h3>
                            <p className="text-sm text-gray-500">
                                If you already have a signed agreement, upload it here.
                            </p>
                        </div>

                        {/* Generate Option */}
                        <div
                            onClick={() => setSelectedMode("generate")}
                            className={`cursor-pointer rounded-2xl border-2 transition-all duration-200 p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md
                ${
                                selectedMode === "generate"
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "border-gray-200 bg-white hover:border-emerald-300"
                            }`}
                        >
                            <FileEdit
                                className={`w-10 h-10 mb-3 ${
                                    selectedMode === "generate"
                                        ? "text-emerald-600"
                                        : "text-gray-400"
                                }`}
                            />
                            <h3 className="font-semibold text-gray-800 mb-1">
                                Generate Lease
                            </h3>
                            <p className="text-sm text-gray-500">
                                Use UpKyp’s guided generator to create a new lease.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={!selectedMode}
                        className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition disabled:opacity-50 shadow"
                    >
                        Continue →
                    </button>
                </div>
            )}

            {/* Step 2: Upload Existing Lease */}
            {step === 2 && (
                <>
                    {/* Lease Summary */}
                    {leaseDetails && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-emerald-600" />
                                Lease Summary
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                                <p>
                                    <span className="font-medium text-gray-500">Tenant:</span>{" "}
                                    {leaseDetails.tenant_name || "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Unit:</span>{" "}
                                    {leaseDetails.unit_name || "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Start Date:</span>{" "}
                                    {leaseDetails.start_date
                                        ? formatDate(leaseDetails.start_date)
                                        : "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">End Date:</span>{" "}
                                    {leaseDetails.end_date
                                        ? formatDate(leaseDetails.end_date)
                                        : "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Monthly Rent:</span>{" "}
                                    ₱{Number(leaseDetails.rent_amount || 0).toLocaleString()}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Status:</span>{" "}
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                            leaseDetails.lease_status === "active"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                    {leaseDetails.lease_status}
                  </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Upload Section */}
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"
                    >
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" /> Upload Agreement
                            Document
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                            <label className="flex flex-col items-center justify-center w-full sm:w-1/2 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                                <div className="flex flex-col items-center justify-center text-gray-600">
                                    <Upload className="w-8 h-8 text-blue-500 mb-2" />
                                    <span className="text-sm font-medium">
                    {file ? file.name : "Click to upload or drag file here"}
                  </span>
                                    <span className="text-xs text-gray-400 mt-1">
                    Supported: PDF, DOCX
                  </span>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>

                            {file && (
                                <div className="flex flex-col items-center justify-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg w-full sm:w-1/2">
                                    <FileCheck className="w-6 h-6 text-emerald-600 mb-1" />
                                    <p className="text-sm font-medium text-gray-700 text-center">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {Math.round(file.size / 1024)} KB
                                    </p>
                                </div>
                            )}
                        </div>

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
                </>
            )}
        </div>
    );
}
