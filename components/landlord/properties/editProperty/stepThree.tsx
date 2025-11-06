"use client";
import { useState, useEffect } from "react";
import useEditPropertyStore from "../../../../zustand/property/useEditPropertyStore";
import { FaImage, FaInfoCircle } from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { UTILITY_BILLING_TYPES } from "../../../../constant/utilityBillingType";
import { PROPERTY_PREFERENCES } from "../../../../constant/propertyPreferences";

// @ts-ignore
export function StepThreeEdit({ propertyId }) {
    // @ts-ignore
    const { property, photos, setProperty, setPhotos } = useEditPropertyStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch existing photos from server
    useEffect(() => {
        const fetchPhotos = async () => {
            if (!propertyId) return;
            try {
                const { data } = await axios.get(
                    `/api/propertyListing/propertyPhotos?property_id=${propertyId}`
                );

                const serverPhotos = data.map((photo: any) => ({
                    file: null,
                    preview: photo.photo_url,
                    photo_id: photo.photo_id,
                    isNew: false,
                }));

                const localNewPhotos = photos.filter((p) => p.isNew);
                setPhotos([...serverPhotos, ...localNewPhotos]);
            } catch (error) {
                console.error("Error fetching photos:", error);
            }
        };
        fetchPhotos();
    }, [propertyId]);

    // Dropzone for new images
    const onDrop = (acceptedFiles: File[]) => {
        const newPhotos = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            photo_id: null,
            isNew: true,
        }));
        setPhotos([...photos, ...newPhotos]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: "image/*",
        multiple: true,
    });

    // Remove image
    const removeImage = async (index: number) => {
        const photo = photos[index];
        if (photo.photo_id && !photo.isNew) {
            try {
                await axios.delete("/api/propertyListing/deletPropertyPhotos", {
                    data: { photo_id: photo.photo_id, property_id: propertyId },
                });
            } catch (error) {
                console.error("Failed to delete photo from server:", error);
                alert("Failed to delete photo from server.");
                return;
            }
        }
        setPhotos(photos.filter((_, i) => i !== index));
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? (checked ? 1 : 0) : value;

        // ✅ Normalize camelCase → snake_case
        const keyMap: Record<string, string> = {
            waterBillingType: "water_billing_type",
            electricityBillingType: "electricity_billing_type",
        };

        const normalizedName = keyMap[name] || name;

        setProperty({
            ...property,
            [normalizedName]: newValue,
        });
    };


    // Toggle preferences
    const togglePreference = (key: string) => {
        const current = property.propertyPreferences || [];
        setProperty({
            ...property,
            propertyPreferences: current.includes(key)
                ? current.filter((item: string) => item !== key)
                : [...current, key],
        });
    };

    // AI description
    const handleGenerateDescription = async () => {
        setLoading(true);
        const { propertyName, propertyType, amenities, street, brgyDistrict, city, zipCode, province } = property;
        const prompt = `Generate a compelling property description for a listing with the following details:
- Name: ${propertyName}
- Type: ${propertyType}
- Amenities: ${amenities?.join(", ") || "None"}
- Location: ${street}, ${brgyDistrict}, ${city}, ${zipCode}, ${province}`;

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-r1:free",
                    messages: [
                        { role: "system", content: "You are a helpful real estate assistant." },
                        { role: "user", content: prompt },
                    ],
                }),
            });
            const data = await response.json();
            const aiText = data?.choices?.[0]?.message?.content?.trim();
            if (aiText) setProperty({ ...property, description: aiText });
        } catch (error) {
            console.error("AI generation error:", error);
            alert("Failed to generate description. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 sm:p-6 space-y-8 rounded-xl">
            {/* Property Details */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                    Edit Property Details
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                    Update your property details. You can always make changes later.
                </p>

                <div className="space-y-5">
                    {/* Description */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={property.description || ""}
                            onChange={handleChange}
                            placeholder="Add a brief description"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                            maxLength={500}
                            rows={5}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateDescription}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            {loading ? (
                                <span>Generating...</span>
                            ) : (
                                <>
                                    <span className="text-base">✨</span> Generate with AI
                                </>
                            )}
                        </button>
                    </div>

                    {/* Floor Area */}
                    <div className="flex items-center gap-2">
                        <div className="flex-grow">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Total Property Size (sqm)
                            </label>
                            <input
                                type="number"
                                name="floorArea"
                                value={property.floorArea || ""}
                                onChange={handleChange}
                                placeholder="e.g., 50"
                                min={0}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <span className="text-gray-600 text-sm font-medium">sqm</span>
                    </div>

                    {/* Preferences */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-3">
                            Property Preferences / Rules
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PROPERTY_PREFERENCES.map((pref) => {
                                const Icon = pref.icon;
                                const isSelected = (property.propertyPreferences || []).includes(pref.key);
                                return (
                                    <button
                                        key={pref.key}
                                        type="button"
                                        onClick={() => togglePreference(pref.key)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border shadow-sm text-sm font-medium transition-all duration-200 ${
                                            isSelected
                                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-transparent shadow-md scale-[1.02]"
                                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                        }`}
                                    >
                                        <Icon className="text-2xl mb-1" />
                                        {pref.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Utility Billing Types */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                                <span>Water Billing Type</span>
                                <FaInfoCircle
                                    className="text-blue-600 text-lg cursor-pointer hover:text-blue-700"
                                    onClick={() => setIsModalOpen(true)}
                                />
                            </label>
                            <select
                                name="waterBillingType"
                                value={property.water_billing_type || ""}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="" disabled>
                                    Select water billing type
                                </option>
                                {UTILITY_BILLING_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                                <span>Electricity Billing Type</span>
                                <FaInfoCircle
                                    className="text-blue-600 text-lg cursor-pointer hover:text-blue-700"
                                    onClick={() => setIsModalOpen(true)}
                                />
                            </label>
                            <select
                                name="electricityBillingType"
                                value={property.electricity_billing_type || ""}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="" disabled>
                                    Select electricity billing type
                                </option>
                                {UTILITY_BILLING_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Info Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 px-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                                Utility Billing Types
                            </h3>
                            <ul className="space-y-2 text-gray-700 text-sm">
                                <li>
                                    <strong>Included:</strong> Rent covers the utility.
                                </li>
                                <li>
                                    <strong>Direct:</strong> Tenant pays the provider directly.
                                </li>
                                <li>
                                    <strong>Submetered:</strong> Tenant is billed based on usage.
                                </li>
                            </ul>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="mt-5 w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-2 rounded-lg shadow-md hover:from-blue-700 hover:to-emerald-700 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Property Photos */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    Property Photos
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mb-4">
                    You can update or add photos of your place.
                </p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl text-center py-10 sm:py-12 cursor-pointer transition-all ${
                        isDragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                >
                    <input {...getInputProps()} />
                    <FaImage className="text-blue-500 text-4xl sm:text-5xl mx-auto mb-3" />
                    <p className="font-medium text-gray-700 text-sm sm:text-base">
                        Drag & drop images here or click to upload
                    </p>
                </div>

                {photos?.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                            <div
                                key={index}
                                className="relative overflow-hidden rounded-xl shadow-sm group"
                            >
                                <img
                                    src={photo.preview}
                                    alt="preview"
                                    className="w-full h-36 object-cover rounded-xl group-hover:opacity-90 transition-all"
                                />
                                <button
                                    type="button"
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition"
                                    onClick={() => removeImage(index)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

}

