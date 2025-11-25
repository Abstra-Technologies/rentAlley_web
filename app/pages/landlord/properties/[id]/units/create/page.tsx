"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { z } from "zod";
import { Plus, Upload, X } from "lucide-react";
import furnishingTypes from "@/constant/furnishingTypes";
import unitTypes from "@/constant/unitTypes";
import AmenitiesSelector from "@/components/landlord/properties/unitAmenities";
import DisableNavigation from "@/components/navigation/DisableNavigation";

// Zod validation schema
const unitSchema = z.object({
    unitName: z.string().min(1, "Unit name is required"),
    unitSize: z.string().min(1, "Unit Size is required"),
    rentAmt: z.number().min(1, "Rent amount is required"),
    furnish: z.string().min(1, "Furnishing selection is required"),
    photos: z.array(z.any()).min(1, "At least one image is required"),
});

export default function UnitListingForm() {
    const searchParams = useSearchParams();
    const propertyId = searchParams.get("property_id");
    const router = useRouter();

    const [formData, setFormData] = useState({
        property_id: propertyId || "",
        unitName: "",
        unitSize: "",
        rentAmt: "",
        furnish: "",
        amenities: [],
        unitType: "",
    });

    const [photos, setPhotos] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [propertyName, setPropertyName] = useState("");
    const [unitNameError, setUnitNameError] = useState("");

    // 360° States
    const [is360Enabled, setIs360Enabled] = useState(false);
    const [photo360, setPhoto360] = useState<File | null>(null);
    const [preview360, setPreview360] = useState("");

    useEffect(() => {
        const fetchPropertyName = async () => {
            if (!propertyId) return;
            try {
                const res = await fetch(
                    `/api/propertyListing/getPropDetailsById?property_id=${propertyId}`
                );
                if (!res.ok) throw new Error("Failed to fetch property");
                const data = await res.json();
                setPropertyName(data.property.property_name);
            } catch {
                setPropertyName("Unknown Property");
            }
        };
        fetchPropertyName();
    }, [propertyId]);

    // Load 360 Viewer
    useEffect(() => {
        if (!preview360) return;
        import("@egjs/view360").then(({ default: Viewer }) => {
            new Viewer("#viewer360", {
                image: preview360,
                projection: "equirectangular",
                autoResize: true,
            });
        });
    }, [preview360]);

    const handleAmenityChange = (amenityName: string) => {
        setFormData((prev) => {
            const isSelected = prev.amenities.includes(amenityName);
            return {
                ...prev,
                amenities: isSelected
                    ? prev.amenities.filter((a) => a !== amenityName)
                    : [...prev.amenities, amenityName],
            };
        });
    };

    const handleChange = async (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        if (name === "unitName" && value.trim() !== "") {
            try {
                const res = await fetch(
                    `/api/unitListing/checkUnitName?property_id=${propertyId}&unitName=${encodeURIComponent(
                        value.trim()
                    )}`
                );
                const data = await res.json();
                setUnitNameError(
                    data.exists ? "This unit name is already in use." : ""
                );
            } catch {}
        }
    };

    // Dropzone for regular photos
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        onDrop: (acceptedFiles) => {
            setPhotos((prevFiles) => [...prevFiles, ...acceptedFiles]);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = unitSchema.safeParse({
            ...formData,
            rentAmt: Number(formData.rentAmt),
            photos,
        });

        if (!result.success) {
            Swal.fire({
                title: "Validation Error",
                text: result.error.errors.map((err) => err.message).join(", "),
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
            return;
        }

        const confirmSubmit = await Swal.fire({
            title: "Create Unit?",
            text: "Do you want to submit this unit listing?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, create it!",
        });

        if (!confirmSubmit.isConfirmed) return;

        setLoading(true);
        const propURL = `/pages/landlord/properties/${propertyId}`;

        try {
            const form = new FormData();
            Object.entries(formData).forEach(([k, v]) => form.append(k, String(v)));
            photos.forEach((photo) => form.append("photos", photo));
            if (photo360) form.append("photo360", photo360);

            await axios.post("/api/unitListing/addUnit", form);

            Swal.fire({
                title: "Success!",
                text: "Unit created successfully!",
                icon: "success",
                confirmButtonColor: "#10b981",
            }).then(() => {
                router.replace(propURL);
            });
        } catch (error: any) {
            Swal.fire({
                title: "Error!",
                text: `Error creating unit: ${error.message}`,
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => router.replace(`/pages/landlord/properties/${propertyId}`);

    return (
        <>
            <DisableNavigation />

            <div className="min-h-screen bg-gray-50">
                <div className="px-4 pt-20 pb-24 md:px-8 lg:px-12 xl:px-16">

                    {/* Header */}
                    <div className="mb-6 flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                            <Plus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create New Unit</h1>
                            <p className="text-sm text-gray-600">
                                Adding unit to <span className="font-semibold">{propertyName}</span>
                            </p>
                        </div>
                    </div>

                    {/* FORM CONTAINER */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b">
                                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                    <h2 className="text-lg font-semibold">Basic Information</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                    {/* UNIT NAME */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Unit Name *</label>
                                        <input
                                            type="text"
                                            name="unitName"
                                            value={formData.unitName}
                                            onChange={handleChange}
                                            placeholder="e.g., Unit 101"
                                            className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                                unitNameError ? "border-red-500" : "border-gray-300"
                                            }`}
                                        />
                                        {unitNameError && (
                                            <p className="text-xs text-red-500">{unitNameError}</p>
                                        )}
                                    </div>

                                    {/* UNIT SIZE */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Unit Size *</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="unitSize"
                                                value={formData.unitSize}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 pr-12 border rounded-lg text-sm"
                                                placeholder="25"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">sqm</span>
                                        </div>
                                    </div>

                                    {/* UNIT TYPE */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Unit Type *</label>
                                        <select
                                            name="unitType"
                                            value={formData.unitType}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                        >
                                            <option value="" disabled>Select unit type</option>
                                            {unitTypes.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* RENT */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Monthly Rent *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                            <input
                                                type="number"
                                                name="rentAmt"
                                                value={formData.rentAmt}
                                                onChange={handleChange}
                                                className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
                                                placeholder="5000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Unit Features */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b">
                                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                    <h2 className="text-lg font-semibold">Unit Features</h2>
                                </div>

                                {/* Furnishing */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Furnishing Type *</label>
                                    <select
                                        name="furnish"
                                        value={formData.furnish}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                    >
                                        <option value="" disabled>Select furnishing type</option>
                                        {furnishingTypes.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amenities */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amenities</label>
                                    <div className="bg-gray-50 p-4 border rounded-lg">
                                        <AmenitiesSelector
                                            selectedAmenities={formData.amenities}
                                            onAmenityChange={handleAmenityChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Photos */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b">
                                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                    <h2 className="text-lg font-semibold">Unit Photos *</h2>
                                </div>

                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed p-8 rounded-lg cursor-pointer ${
                                        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                                    }`}
                                >
                                    <input
                                        {...getInputProps({
                                            accept: "image/*",
                                            capture: "environment", // CAMERA ENABLED
                                        })}
                                    />

                                    <div className="text-center">
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                                        <p className="text-sm text-gray-600 mt-2">
                                            Tap to take a photo or upload.
                                        </p>
                                    </div>
                                </div>

                                {/* PREVIEW */}
                                {photos.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {photos.map((photo, i) => (
                                            <div key={i} className="relative group">
                                                <Image
                                                    src={URL.createObjectURL(photo)}
                                                    width={200}
                                                    height={200}
                                                    className="rounded-lg object-cover"
                                                    alt="Unit photo"
                                                />
                                                <button
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                                                    onClick={() => {
                                                        const updated = [...photos];
                                                        updated.splice(i, 1);
                                                        setPhotos(updated);
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 360° Virtual View */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b">
                                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                                    <h2 className="text-lg font-semibold">Optional: 360° View</h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium">Enable 360° View?</label>
                                    <input
                                        type="checkbox"
                                        checked={is360Enabled}
                                        onChange={(e) => setIs360Enabled(e.target.checked)}
                                        className="w-5 h-5 accent-blue-600"
                                    />
                                </div>

                                {is360Enabled && (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment" // CAMERA ENABLED FOR 360°
                                            id="upload360"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setPhoto360(file);
                                                setPreview360(URL.createObjectURL(file));
                                            }}
                                        />

                                        <label
                                            htmlFor="upload360"
                                            className="cursor-pointer text-blue-600 underline"
                                        >
                                            Take 360° Panoramic Photo
                                        </label>

                                        {preview360 && (
                                            <div id="viewer360" className="w-full h-64 border rounded-lg" />
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-5 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                                >
                                    {loading ? "Creating..." : "Create Unit"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
