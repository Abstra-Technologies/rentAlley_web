"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_CATEGORIES } from "@/constant/maintenanceCategories";
import {
    QrCodeIcon,
    WrenchScrewdriverIcon,
    XMarkIcon,
    CloudArrowUpIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    HomeIcon,
    BuildingOffice2Icon,
    WrenchIcon,
} from "@heroicons/react/24/outline";
import { BackButton } from "../navigation/backButton";
import { QrReader } from "react-qr-reader";

const maintenanceSchema = z.object({
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
});

export default function MaintenanceRequestForm() {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const agreement_id = searchParams.get("agreement_id");

    const [assetId, setAssetId] = useState("");
    const [assetDetails, setAssetDetails] = useState<any>(null);
    const [loadingAsset, setLoadingAsset] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [description, setDescription] = useState("");
    const [isEmergency, setIsEmergency] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ✅ Auto-fetch asset details when Asset ID changes
    useEffect(() => {
        if (!assetId) {
            setAssetDetails(null);
            return;
        }

        const fetchAsset = async () => {
            try {
                setLoadingAsset(true);
                const res = await axios.get(`/api/landlord/properties/assets/detailed?asset_id=${assetId}`);
                setAssetDetails(res.data);
            } catch (err) {
                console.error("Asset fetch error:", err);
                setAssetDetails(null);
                Swal.fire({
                    icon: "error",
                    title: "Asset Not Found",
                    text: "No asset found with this code. Please check your entry or rescan.",
                    confirmButtonColor: "#ef4444",
                });
            } finally {
                setLoadingAsset(false);
            }
        };
        fetchAsset();
    }, [assetId]);

    // ✅ QR scanning
    const handleScan = (result: any) => {
        if (result) {
            const code = result?.text || result;
            setAssetId(code);
            setShowScanner(false);
            Swal.fire({
                icon: "success",
                title: "QR Code Scanned!",
                text: `Asset ID: ${code}`,
                confirmButtonColor: "#10b981",
            });
        }
    };

    const handleError = (err: any) => {
        console.error("QR Reader Error:", err);
        setShowScanner(false);
        Swal.fire({
            icon: "error",
            title: "Camera Error",
            text: "Please allow camera permissions or enter the Asset ID manually.",
            confirmButtonColor: "#ef4444",
        });
    };

    // ✅ File upload logic
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setPhotos((prev) => [...prev, ...newFiles]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) {
            const valid = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
            setPhotos((prev) => [...prev, ...valid]);
        }
    };

    const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

    // ✅ Submit maintenance request
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validation = maintenanceSchema.safeParse({
            category: selectedCategory,
            description,
        });

        if (!validation.success) {
            const formatted = validation.error.format();
            setErrors({
                category: formatted.category?._errors[0],
                description: formatted.description?._errors[0],
            });

            Swal.fire({
                icon: "error",
                title: "Missing Fields",
                text: "Please fill all required fields before submitting.",
                confirmButtonColor: "#ef4444",
            });

            setIsSubmitting(false);
            return;
        }

        // ✅ 2️⃣ Warn if no asset ID provided
        if (!assetId.trim()) {
            const confirm = await Swal.fire({
                icon: "warning",
                title: "No Asset Linked",
                text: "You did not provide or scan an asset ID. Continue as a general unit request?",
                showCancelButton: true,
                confirmButtonText: "Yes, Continue",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#10b981",
                cancelButtonColor: "#ef4444",
            });

            if (!confirm.isConfirmed) {
                setIsSubmitting(false);
                return;
            }
        }

        Swal.fire({
            title: "Submitting Request...",
            text: "Please wait while we process your maintenance request.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const fd = new FormData();
            fd.append("agreement_id", agreement_id || "");
            fd.append("category", selectedCategory);
            fd.append("subject", selectedCategory);
            fd.append("description", description);
            fd.append("is_emergency", isEmergency ? "1" : "0");
            fd.append("user_id", user?.user_id || "");

            // ✅ Include asset ID if present
            if (assetId.trim()) {
                fd.append("asset_id", assetId);
            }

            // ✅ Append uploaded images
            photos.forEach((p) => fd.append("photos", p));

            // ✅ 5️⃣ Send API request
            const res = await axios.post("/api/maintenance/createMaintenance", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.success) {
                const isHighPriority = isEmergency || res.data?.auto_high_priority;

                Swal.fire({
                    icon: "success",
                    title: "Request Submitted!",
                    html: isHighPriority
                        ? `<p>Your request is marked as <b class='text-red-600'>HIGH PRIORITY</b>.</p>`
                        : `<p>Your maintenance request has been successfully submitted.</p>`,
                    confirmButtonColor: "#10b981",
                }).then(() => {
                    router.push(`/pages/tenant/maintenance?agreement_id=${agreement_id}`);
                });
            } else {
                throw new Error(res.data?.error || "Unknown error occurred");
            }
        } catch (err: any) {
            console.error("❌ Submission Error:", err);

            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text:
                    err.response?.data?.error ||
                    "Unable to submit your request. Please try again later.",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -m-4 md:-m-8">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
                <BackButton label="Back to Requests" />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-4">
                    {/* HEADER */}
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-6 text-white flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <WrenchScrewdriverIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Maintenance Request</h1>
                            <p className="text-blue-100 text-sm">
                                Scan or enter an asset code to begin your request.
                            </p>
                        </div>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        {/* ASSET CODE FIELD */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Asset Code / ID
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={assetId}
                                    onChange={(e) => setAssetId(e.target.value)}
                                    placeholder="Enter Asset ID manually"
                                    className="flex-1 border-2 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:opacity-90 transition"
                                >
                                    <QrCodeIcon className="w-5 h-5" />
                                    Scan
                                </button>
                            </div>
                        </div>

                        {/* QR SCANNER */}
                        {showScanner && (
                            <div className="relative bg-black rounded-xl overflow-hidden mt-3">
                                <QrReader
                                    onResult={(result, error) => {
                                        if (!!result) handleScan(result);
                                        if (!!error) console.error(error);
                                    }}
                                    constraints={{ facingMode: "environment" }}
                                    videoStyle={{ width: "100%", height: "auto" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(false)}
                                    className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                                >
                                    <XMarkIcon className="w-4 h-4 inline-block mr-1" /> Close
                                </button>
                            </div>
                        )}

                        {/* ASSET DETAILS */}
                        {loadingAsset ? (
                            <div className="text-gray-500 italic text-sm">Loading asset details...</div>
                        ) : assetDetails ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                                    <WrenchIcon className="w-5 h-5 text-blue-600" />
                                    Asset Details
                                </h3>
                                <p><b>Name:</b> {assetDetails.asset_name}</p>
                                <p><b>Category:</b> {assetDetails.category || "—"}</p>
                                <p><b>Model:</b> {assetDetails.model || "—"}</p>
                                <p><b>Manufacturer:</b> {assetDetails.manufacturer || "—"}</p>
                                <p><b>Serial No:</b> {assetDetails.serial_number || "—"}</p>
                                <p>
                                    <b>Assigned To:</b>{" "}
                                    {assetDetails.unit_name ? (
                                        <span className="inline-flex items-center gap-1 text-blue-600">
                      <HomeIcon className="w-4 h-4" /> {assetDetails.unit_name}
                    </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-gray-600">
                      <BuildingOffice2Icon className="w-4 h-4" /> Property-Level
                    </span>
                                    )}
                                </p>
                            </div>
                        ) : null}

                        {/* CATEGORY */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Problem Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {MAINTENANCE_CATEGORIES.map((item) => {
                                    const isActive = selectedCategory === item.value;
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            type="button"
                                            key={item.value}
                                            onClick={() => setSelectedCategory(item.value)}
                                            className={`flex flex-col items-center justify-center h-28 border-2 rounded-xl transition-all ${
                                                isActive
                                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                                            }`}
                                        >
                                            {Icon ? (
                                                <Icon
                                                    className={`w-8 h-8 mb-2 ${
                                                        isActive ? "text-blue-600" : "text-gray-600"
                                                    }`}
                                                />
                                            ) : (
                                                <WrenchScrewdriverIcon className="w-8 h-8 mb-2 text-gray-600" />
                                            )}
                                            <span
                                                className={`font-semibold ${
                                                    isActive ? "text-blue-700" : "text-gray-700"
                                                }`}
                                            >
                        {item.label}
                      </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.category && (
                                <div className="mt-2 flex items-center text-red-600 text-sm">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                                    {errors.category}
                                </div>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className={`w-full p-4 border-2 rounded-xl resize-none ${
                                    errors.description
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-200 hover:border-blue-300"
                                }`}
                                placeholder="Describe the problem, when it started, and any observations..."
                            />
                        </div>

                        {/* EMERGENCY TOGGLE */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                            <div>
                                <h3 className="font-semibold text-gray-900">Is this an Emergency?</h3>
                                <p className="text-sm text-gray-600">
                                    Mark if this requires immediate attention.
                                </p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isEmergency}
                                    onChange={() => setIsEmergency(!isEmergency)}
                                />
                                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-red-500 transition-colors relative">
                                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                                </div>
                            </label>
                        </div>

                        {/* PHOTO UPLOAD */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Photos (optional)
                            </label>
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActive(true);
                                }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                    dragActive
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-gray-300 hover:border-blue-300"
                                }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <CloudArrowUpIcon className="w-10 h-10 text-blue-600 mx-auto" />
                                <p className="text-gray-700 font-medium">
                                    Drag & Drop or Click to Upload Photos
                                </p>
                                <p className="text-sm text-gray-500">
                                    Supported: JPG, PNG (max 10MB each)
                                </p>
                            </div>
                            {photos.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                                    {photos.map((photo, i) => (
                                        <div key={i} className="relative group">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                className="w-full h-28 object-cover rounded-lg border border-gray-200"
                                                alt={`Photo ${i + 1}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(i)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SUBMIT */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold text-lg hover:shadow-md hover:from-blue-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-6 h-6" />
                                        Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
