"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import TenantLayout from "@/components/navigation/sidebar-tenant";
import { MAINTENANCE_CATEGORIES } from "@/constant/maintenanceCategories";
import Swal from "sweetalert2";
import { z } from "zod";
import useAuthStore from "@/zustand/authStore";
import { BackButton } from "../navigation/backButton";
import {
    WrenchScrewdriverIcon,
    PhotoIcon,
    CloudArrowUpIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const maintenanceRequestSchema = z.object({
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
    photos: z.array(z.instanceof(File)).min(1, "At least one photo is required"),
});

type ValidationErrors = {
    category?: string;
    description?: string;
    photos?: string;
};

export default function MaintenanceRequestForm() {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const agreement_id = searchParams.get("agreement_id");

    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isEmergency, setIsEmergency] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setPhotos((prev) => [...prev, ...newFiles]);
            setErrors((prev) => ({ ...prev, photos: undefined }));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) {
            const valid = Array.from(e.dataTransfer.files).filter((f) =>
                f.type.startsWith("image/")
            );
            setPhotos((prev) => [...prev, ...valid]);
        }
    };

    const removePhoto = (i: number) =>
        setPhotos((prev) => prev.filter((_, idx) => idx !== i));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = { category: selectedCategory, description, photos };
        const validation = maintenanceRequestSchema.safeParse(formData);
        if (!validation.success) {
            const formatted = validation.error.format();
            setErrors({
                category: formatted.category?._errors[0],
                description: formatted.description?._errors[0],
                photos: formatted.photos?._errors[0],
            });
            Swal.fire({
                icon: "error",
                title: "Please complete all fields",
                text: "Fill in all required information and attach at least one photo.",
                confirmButtonColor: "#ef4444",
            });
            setIsSubmitting(false);
            return;
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
            fd.append("subject", selectedCategory); // ✅ subject automatically set from category
            fd.append("description", description);
            fd.append("is_emergency", isEmergency ? "1" : "0");
            fd.append("user_id", user?.user_id || "");

            photos.forEach((p) => fd.append("photos", p));

            // 🧠 Submit to atomic backend API
            const res = await axios.post("/api/maintenance/createMaintenance", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const { success, priority_level } = res.data;

            if (success) {
                Swal.fire({
                    icon: "success",
                    title: "Request Submitted Successfully!",
                    html: isEmergency
                        ? `<p>Your emergency request has been marked as <b class='text-red-600'>HIGH PRIORITY</b>.</p>
             <p>The landlord has been notified immediately.</p>`
                        : `<p>Your request has been sent and will be processed shortly.</p>`,
                    confirmButtonColor: "#10b981",
                    confirmButtonText: "View My Requests",
                }).then(() =>
                    router.push(`/pages/tenant/maintenance?agreement_id=${agreement_id}`)
                );
            } else {
                throw new Error("Failed to create request");
            }
        } catch (err: any) {
            console.error("Maintenance submission error:", err);
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
        <TenantLayout agreement_id={agreement_id}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -m-4 md:-m-8">
                <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mb-6">
                        <BackButton label="Back to Requests" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-8 text-white">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                    <WrenchScrewdriverIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Submit Maintenance Request
                                    </h1>
                                    <p className="text-blue-100 text-sm">
                                        Select an issue and describe the problem
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                            {/* CATEGORY SELECTION */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
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
                                                onClick={() => {
                                                    setSelectedCategory(item.value);
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        category: undefined,
                                                    }));
                                                }}
                                                className={`flex flex-col items-center justify-center h-28 border-2 rounded-xl transition-all ${
                                                    isActive
                                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                                                }`}
                                            >
                                                {Icon ? (
                                                    <item.icon
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

                            {/* EMERGENCY TOGGLE */}
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        Is this an Emergency?
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Mark this if the issue needs immediate attention
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

                            {/* DESCRIPTION */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        setErrors((prev) => ({
                                            ...prev,
                                            description: undefined,
                                        }));
                                    }}
                                    rows={4}
                                    className={`w-full p-4 border-2 rounded-xl resize-none ${
                                        errors.description
                                            ? "border-red-300 bg-red-50"
                                            : "border-gray-200 hover:border-blue-300"
                                    }`}
                                    placeholder="Describe when it started, how it affects you, and any observations..."
                                />
                            </div>

                            {/* PHOTO UPLOAD */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Photos <span className="text-red-500">*</span>
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
                                    <div className="space-y-2">
                                        <CloudArrowUpIcon className="w-10 h-10 text-blue-600 mx-auto" />
                                        <p className="text-gray-700 font-medium">
                                            Drag & Drop or Click to Upload Photos
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Supported: JPG, PNG (max 10MB each)
                                        </p>
                                    </div>
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
        </TenantLayout>
    );
}
