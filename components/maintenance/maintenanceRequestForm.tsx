"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_CATEGORIES } from "@/constant/maintenanceCategories";

import {
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

    const [selectedCategory, setSelectedCategory] = useState("");
    const [description, setDescription] = useState("");
    const [isEmergency, setIsEmergency] = useState(false);

    const [photos, setPhotos] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    /* ==========================================================================
       FETCH ASSET DETAILS
    ========================================================================== */
    useEffect(() => {
        if (!assetId.trim()) {
            setAssetDetails(null);
            return;
        }

        const fetchAsset = async () => {
            try {
                setLoadingAsset(true);
                const res = await axios.get(
                    `/api/landlord/properties/assets/detailed?asset_id=${assetId}`
                );
                setAssetDetails(res.data);
            } catch {
                setAssetDetails(null);
                Swal.fire({
                    icon: "error",
                    title: "Asset Not Found",
                    text: "No asset found with this code.",
                });
            } finally {
                setLoadingAsset(false);
            }
        };
        fetchAsset();
    }, [assetId]);

    /* ==========================================================================
       FILE UPLOAD
    ========================================================================== */
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const valid = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith("image/")
        );
        setPhotos((prev) => [...prev, ...valid]);
    };

    const removePhoto = (i: number) => {
        setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    };

    /* ==========================================================================
       SUBMIT
    ========================================================================== */
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
                text: "Please fill all required fields.",
            });

            setIsSubmitting(false);
            return;
        }

        try {
            const fd = new FormData();
            fd.append("agreement_id", agreement_id || "");
            fd.append("category", selectedCategory);
            fd.append("subject", selectedCategory);
            fd.append("description", description);
            fd.append("is_emergency", isEmergency ? "1" : "0");
            fd.append("user_id", user?.user_id || "");

            if (assetId.trim()) fd.append("asset_id", assetId);
            photos.forEach((p) => fd.append("photos", p));

            const res = await axios.post("/api/maintenance/createMaintenance", fd);

            if (res.data?.success) {
                Swal.fire({
                    icon: "success",
                    title: "Request Submitted!",
                }).then(() => {
                    router.push(`/pages/tenant/maintenance?agreement_id=${agreement_id}`);
                });
            }
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: err.response?.data?.error || "Please try again later.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ==========================================================================
       UI
    ========================================================================== */
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 pt-4 sm:pt-6 md:pt-10">
            <div className="max-w-4xl mx-auto px-3 sm:px-5 pb-10">
                <BackButton label="Back to Requests" />

                <div className="bg-white rounded-2xl shadow-xl border mt-4 sm:mt-6 overflow-hidden">

                    {/* HEADER */}
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 sm:px-6 py-6 sm:py-8 text-white flex items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                            <WrenchScrewdriverIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-bold">Maintenance Request</h1>
                            <p className="text-blue-100 text-xs sm:text-sm">
                                Submit a request and we’ll handle it right away.
                            </p>
                        </div>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6 sm:space-y-10">

                        {/* ASSET CODE */}
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2">
                                Asset Code / ID
                            </label>
                            <input
                                type="text"
                                value={assetId}
                                onChange={(e) => setAssetId(e.target.value)}
                                placeholder="Enter asset code (optional)"
                                className="w-full border-2 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* ASSET DETAILS */}
                        {loadingAsset && (
                            <p className="text-gray-500 text-sm">Loading asset details...</p>
                        )}

                        {assetDetails && (
                            <div className="bg-gray-50 border rounded-xl p-4 shadow-sm text-sm sm:text-base space-y-1">
                                <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                                    <WrenchIcon className="w-5 h-5 text-blue-600" />
                                    Asset Details
                                </h3>
                                <p><b>Name:</b> {assetDetails.asset_name}</p>
                                <p><b>Category:</b> {assetDetails.category || "—"}</p>
                                <p><b>Model:</b> {assetDetails.model || "—"}</p>
                                <p><b>Serial No:</b> {assetDetails.serial_number || "—"}</p>

                                <p className="pt-2">
                                    <b>Assigned To:</b>{" "}
                                    {assetDetails.unit_name ? (
                                        <span className="text-blue-600 inline-flex items-center gap-1">
                      <HomeIcon className="w-4 h-4" /> {assetDetails.unit_name}
                    </span>
                                    ) : (
                                        <span className="text-gray-600 inline-flex items-center gap-1">
                      <BuildingOffice2Icon className="w-4 h-4" />
                      Property-Level
                    </span>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* CATEGORY GRID */}
                        <div>
                            <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">
                                Problem Type *
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                {MAINTENANCE_CATEGORIES.map((item) => {
                                    const isActive = selectedCategory === item.value;
                                    const Icon = item.icon;

                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => setSelectedCategory(item.value)}
                                            className={`h-24 sm:h-28 flex flex-col items-center justify-center rounded-xl border-2 shadow-sm 
                        transition hover:shadow-md
                        ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}
                      `}
                                        >
                                            <Icon
                                                className={`w-7 h-7 sm:w-8 sm:h-8 mb-2 ${
                                                    isActive ? "text-blue-600" : "text-gray-600"
                                                }`}
                                            />
                                            <span
                                                className={`text-xs sm:text-sm font-semibold ${
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
                                <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                                    {errors.category}
                                </p>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">
                                Description *
                            </label>

                            <textarea
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue..."
                                className={`w-full p-3 sm:p-4 border-2 rounded-xl text-sm sm:text-base resize-none shadow-sm ${
                                    errors.description ? "border-red-300 bg-red-50" : "border-gray-200"
                                }`}
                            />

                            {errors.description && (
                                <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* EMERGENCY */}
                        <div className="flex justify-between p-3 sm:p-4 bg-gray-50 border rounded-xl shadow-sm">
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base">Emergency?</h3>
                                <p className="text-xs sm:text-sm text-gray-600">Requires immediate attention.</p>
                            </div>

                            <label className="inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isEmergency} onChange={() => setIsEmergency(!isEmergency)} />
                                <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-300 rounded-full peer-checked:bg-red-500 relative">
                                    <span className="absolute left-1 top-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full transition peer-checked:translate-x-5"></span>
                                </div>
                            </label>
                        </div>

                        {/* PHOTO UPLOAD */}
                        <div>
                            <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">
                                Photos (optional)
                            </label>

                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActive(true);
                                }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-5 sm:p-8 text-center ${
                                    dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
                                }`}
                            >
                                <label className="cursor-pointer flex flex-col items-center">
                                    <CloudArrowUpIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mx-auto" />
                                    <p className="text-gray-700 text-xs sm:text-sm font-medium mt-2">
                                        Click or drag photos to upload
                                    </p>
                                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>

                            {photos.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                                    {photos.map((photo, i) => (
                                        <div key={i} className="relative group">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                className="w-full h-20 sm:h-28 object-cover rounded-xl border shadow-sm"
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
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="
                w-full py-3 sm:py-4 rounded-xl shadow-md
                bg-gradient-to-r from-blue-600 to-emerald-600
                text-white text-sm sm:text-lg font-semibold
                hover:shadow-lg hover:brightness-105 transition-all
                disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 sm:gap-3
              "
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    Submit Request
                                </>
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
