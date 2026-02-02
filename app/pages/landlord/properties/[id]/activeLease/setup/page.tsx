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
    HelpCircle,
} from "lucide-react";

import GenerateLease from "./GenerateLease";
import { useOnboarding } from "@/hooks/useOnboarding";
import { leaseSetupSteps } from "@/lib/onboarding/leaseSetupMode";

/* ===============================
   Constants
================================ */
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function SetupLeasePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const property_id = params.id as string;
    const agreement_id = searchParams.get("agreement_id");

    const [leaseDetails, setLeaseDetails] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedMode, setSelectedMode] = useState<
        "upload" | "generate" | null
    >(null);

    const STORAGE_KEY = `lease_setup_${agreement_id}`;

    const { startTour } = useOnboarding({
        tourId: "lease-setup-page",
        steps: leaseSetupSteps,
        autoStart: true,
    });

    /* ===============================
       Restore Progress
    ================================ */
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
            JSON.stringify({ step, selectedMode })
        );
    }, [step, selectedMode, agreement_id]);

    /* ===============================
       Fetch Lease Details
    ================================ */
    useEffect(() => {
        if (!agreement_id) return;

        async function fetchLeaseDetails() {
            try {
                const res = await axios.get(
                    `/api/landlord/activeLease/getByAgreementId`,
                    { params: { agreement_id } }
                );
                setLeaseDetails(res.data || {});
            } catch {
                Swal.fire("Error", "Failed to load lease details.", "error");
            }
        }

        fetchLeaseDetails();
    }, [agreement_id]);

    /* ===============================
       File Validation (10MB)
    ================================ */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.size > MAX_FILE_SIZE) {
            Swal.fire({
                icon: "warning",
                title: "File too large",
                text: `Please upload a lease document smaller than ${MAX_FILE_SIZE_MB} MB.`,
                confirmButtonColor: "#2563eb",
            });

            e.target.value = "";
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    /* ===============================
       Upload Lease
    ================================ */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
            Swal.fire("Missing File", "Please upload a lease document.", "warning");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            Swal.fire(
                "File too large",
                `Please upload a lease document smaller than ${MAX_FILE_SIZE_MB} MB.`,
                "warning"
            );
            return;
        }

        const formData = new FormData(e.currentTarget);
        formData.append("agreement_id", agreement_id!);
        formData.append("property_id", property_id);
        formData.append("lease_file", file);

        if (leaseDetails) {
            formData.append("tenant_id", leaseDetails.tenant_id);
            formData.append("landlord_id", leaseDetails.landlord_id);
        }

        if (!formData.get("start_date")) {
            Swal.fire("Incomplete", "Please provide lease start date.", "warning");
            return;
        }

        setIsUploading(true);

        try {
            await axios.post(
                `/api/landlord/activeLease/uploadLease`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            Swal.fire({
                title: "Success",
                text: "Lease uploaded successfully!",
                icon: "success",
                confirmButtonColor: "#059669",
            });

            router.push(
                `/pages/landlord/properties/${property_id}/activeLease`
            );
        } catch (error: any) {
            Swal.fire(
                "Upload Failed",
                error.response?.data?.message ||
                "There was a problem uploading the lease.",
                "error"
            );
        } finally {
            setIsUploading(false);
        }
    };

    /* ===============================
       UI
    ================================ */
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        Setup Lease Agreement
                    </h1>
                </div>

                <button
                    onClick={startTour}
                    className="mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                    <HelpCircle className="w-4 h-4" />
                    Show Guide
                </button>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="text-center">
                    <h2 className="text-lg font-semibold mb-6">
                        Choose how to set up your lease
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
                        <div
                            onClick={() => setSelectedMode("upload")}
                            className={`cursor-pointer rounded-2xl border-2 p-6 transition ${
                                selectedMode === "upload"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white"
                            }`}
                        >
                            <FileUp className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                            <h3 className="font-semibold">Upload Existing Lease</h3>
                            <p className="text-sm text-gray-500">
                                Upload a signed lease document
                            </p>
                        </div>

                        <div
                            onClick={() => setSelectedMode("generate")}
                            className={`cursor-pointer rounded-2xl border-2 p-6 transition ${
                                selectedMode === "generate"
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "border-gray-200 bg-white"
                            }`}
                        >
                            <FileEdit className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                            <h3 className="font-semibold">Generate Lease</h3>
                            <p className="text-sm text-gray-500">
                                Create a new lease using guided steps
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!selectedMode}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg disabled:opacity-50"
                    >
                        Continue →
                    </button>
                </div>
            )}

            {/* STEP 2 – UPLOAD */}
            {step === 2 && selectedMode === "upload" && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border p-6 shadow"
                >
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Upload Lease Document
                    </h2>

                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 mb-4">
                        <Upload className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-sm font-medium">
              {file ? file.name : "Click to upload or drag file"}
            </span>
                        <span className="text-xs text-gray-400 mt-1">
              PDF, DOCX • Max {MAX_FILE_SIZE_MB} MB
            </span>
                        <input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>

                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-gray-600 flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <FileCheck className="w-4 h-4" />
                                    Submit Agreement
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 2 – GENERATE */}
            {step === 2 && selectedMode === "generate" && (
                <GenerateLease
                    property_id={property_id}
                    agreement_id={agreement_id}
                    leaseDetails={leaseDetails}
                />
            )}
        </div>
    );
}
