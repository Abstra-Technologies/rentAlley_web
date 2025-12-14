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

    /* -------------------------------------------------------------------------- */
    /* FETCH ASSET                                                                 */
    /* -------------------------------------------------------------------------- */
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
                Swal.fire("Asset Not Found", "No asset found with this code.", "error");
            } finally {
                setLoadingAsset(false);
            }
        };

        fetchAsset();
    }, [assetId]);

    /* -------------------------------------------------------------------------- */
    /* FILE HANDLING                                                               */
    /* -------------------------------------------------------------------------- */
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const images = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith("image/")
        );
        setPhotos((prev) => [...prev, ...images]);
    };

    const removePhoto = (i: number) => {
        setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    };

    /* -------------------------------------------------------------------------- */
    /* SUBMIT                                                                      */
    /* -------------------------------------------------------------------------- */
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

            Swal.fire("Missing Fields", "Please complete all required fields.", "error");
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
                Swal.fire("Submitted!", "Maintenance request sent.", "success").then(() =>
                    router.push(`/pages/tenant/maintenance?agreement_id=${agreement_id}`)
                );
            }
        } catch (err: any) {
            Swal.fire(
                "Submission Failed",
                err.response?.data?.error || "Please try again later.",
                "error"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    /* -------------------------------------------------------------------------- */
    /* UI                                                                          */
    /* -------------------------------------------------------------------------- */
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-6">
                <div className="max-w-4xl lg:max-w-3xl xl:max-w-2xl mx-auto">
                    <BackButton label="Back to Requests" />

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-5 overflow-hidden">
                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-6 lg:py-5 xl:py-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 lg:w-10 lg:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <WrenchScrewdriverIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-xl font-bold">
                                        Maintenance Request
                                    </h1>
                                    <p className="text-blue-100 text-xs sm:text-sm lg:text-xs">
                                        Report an issue and we’ll take care of it.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FORM */}
                        <form
                            onSubmit={handleSubmit}
                            className="p-5 sm:p-6 lg:p-5 space-y-6 lg:space-y-4"
                        >
                            {/* ASSET */}
                            <div>
                                <label className="text-sm font-semibold text-gray-800">
                                    Asset Code (optional)
                                </label>
                                <input
                                    value={assetId}
                                    onChange={(e) => setAssetId(e.target.value)}
                                    className="mt-2 w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter asset code"
                                />
                            </div>

                            {loadingAsset && (
                                <p className="text-sm text-blue-600">Loading asset...</p>
                            )}

                            {assetDetails && (
                                <div className="p-4 bg-blue-50 border rounded-xl text-sm space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <WrenchIcon className="w-4 h-4" />
                                        Asset Details
                                    </div>
                                    <p><b>Name:</b> {assetDetails.asset_name}</p>
                                    <p><b>Model:</b> {assetDetails.model || "—"}</p>
                                    <p className="flex items-center gap-1">
                                        {assetDetails.unit_name ? (
                                            <>
                                                <HomeIcon className="w-4 h-4" />
                                                {assetDetails.unit_name}
                                            </>
                                        ) : (
                                            <>
                                                <BuildingOffice2Icon className="w-4 h-4" />
                                                Property Level
                                            </>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* CATEGORY */}
                            <div>
                                <label className="text-sm font-semibold text-gray-800">
                                    Problem Type *
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                    {MAINTENANCE_CATEGORIES.map((item) => {
                                        const active = selectedCategory === item.value;
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                type="button"
                                                key={item.value}
                                                onClick={() => setSelectedCategory(item.value)}
                                                className={`h-24 sm:h-28 lg:h-20 flex flex-col items-center justify-center rounded-xl border transition ${
                                                    active
                                                        ? "bg-blue-50 border-blue-500"
                                                        : "bg-white border-gray-200"
                                                }`}
                                            >
                                                <Icon className="w-6 h-6 mb-1 text-blue-600" />
                                                <span className="text-xs sm:text-sm lg:text-xs font-semibold">
                          {item.label}
                        </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="text-sm font-semibold text-gray-800">
                                    Description *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-2 w-full p-4 text-sm border rounded-xl min-h-[140px] lg:min-h-[110px] xl:min-h-[90px]"
                                    placeholder="Describe the issue..."
                                />
                            </div>

                            {/* EMERGENCY */}
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border">
                                <div>
                                    <p className="font-semibold text-sm">Emergency?</p>
                                    <p className="text-xs text-gray-600">
                                        Requires immediate attention
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isEmergency}
                                    onChange={() => setIsEmergency(!isEmergency)}
                                    className="w-5 h-5 accent-red-600"
                                />
                            </div>

                            {/* UPLOAD */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActive(true);
                                }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-6 lg:p-4 text-center ${
                                    dragActive ? "bg-blue-50" : ""
                                }`}
                            >
                                <label className="cursor-pointer">
                                    <CloudArrowUpIcon className="w-8 h-8 mx-auto text-blue-600" />
                                    <p className="text-sm mt-2">Upload photos</p>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* SUBMIT */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 lg:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Request"}
                                <CheckCircleIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
