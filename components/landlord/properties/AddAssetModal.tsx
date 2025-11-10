"use client";

import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Dialog } from "@headlessui/react";
import {
    XMarkIcon,
    PlusCircleIcon,
    CameraIcon,
    TrashIcon,
} from "@heroicons/react/24/solid";

interface AddAssetModalProps {
    propertyId: string;
    units?: { unit_id: string; unit_name: string }[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddAssetModal({
                                          propertyId,
                                          units = [],
                                          isOpen,
                                          onClose,
                                          onSuccess,
                                      }: AddAssetModalProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        asset_name: "",
        category: "",
        model: "",
        manufacturer: "",
        serial_number: "",
        description: "",
        purchase_date: "",
        warranty_expiry: "",
        unit_id: "",
        status: "active",
        condition: "good",
    });
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // 🔹 Handle input change
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 🔹 Handle file/camera upload
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const selected = Array.from(files);
        const updatedImages = [...images, ...selected];
        setImages(updatedImages);

        // Generate image previews
        const newPreviews = selected.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prev) => [...prev, ...newPreviews]);
    };

    // 🔹 Remove image from preview
    const removeImage = (index: number) => {
        const updated = [...images];
        const updatedPreviews = [...previewUrls];
        updated.splice(index, 1);
        updatedPreviews.splice(index, 1);
        setImages(updated);
        setPreviewUrls(updatedPreviews);
    };

    // 🔹 Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();

            // 🔹 Append basic asset fields
            formData.append("property_id", propertyId);
            formData.append("asset_name", form.asset_name);
            formData.append("category", form.category);
            formData.append("model", form.model);
            formData.append("manufacturer", form.manufacturer);
            formData.append("serial_number", form.serial_number);
            formData.append("description", form.description);
            formData.append("purchase_date", form.purchase_date);
            formData.append("warranty_expiry", form.warranty_expiry);
            formData.append("unit_id", form.unit_id);
            formData.append("status", form.status);
            formData.append("condition", form.condition);

            // 🔹 Append image files (if any)
            images.forEach((file) => formData.append("images", file));

            await axios.post("/api/landlord/properties/assets/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire({
                title: "Success!",
                text: "Asset added successfully.",
                icon: "success",
                timer: 1800,
                showConfirmButton: false,
            });

            onSuccess?.();
            onClose();
            setImages([]);
            setPreviewUrls([]);
        } catch (error: any) {
            console.error("Asset creation failed:", error);
            Swal.fire(
                "Error",
                error.response?.data?.error || "Failed to create asset.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

            {/* Modal Panel */}
            <div
                className="
        relative w-full
        max-w-2xl sm:max-w-3xl
        bg-white shadow-2xl sm:rounded-2xl
        overflow-y-auto
        max-h-[95vh] sm:max-h-[90vh]
        animate-fadeInUp
      "
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-4 flex justify-between items-center">
                    <h2 className="text-white text-lg sm:text-xl font-semibold flex items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5" />
                        Add New Asset
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/90 hover:text-white transition"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 md:p-8 space-y-5">
                    {/* Asset Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Asset Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="asset_name"
                            value={form.asset_name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Air Conditioning Unit"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category & Model */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                placeholder="e.g. HVAC, Plumbing"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model
                            </label>
                            <input
                                name="model"
                                value={form.model}
                                onChange={handleChange}
                                placeholder="e.g. Daikin FXA12"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Manufacturer & Serial Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer
                            </label>
                            <input
                                name="manufacturer"
                                value={form.manufacturer}
                                onChange={handleChange}
                                placeholder="e.g. Samsung, Panasonic"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Serial Number
                            </label>
                            <input
                                name="serial_number"
                                value={form.serial_number}
                                onChange={handleChange}
                                placeholder="e.g. SN-00123"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Images (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
                                <CameraIcon className="w-5 h-5" />
                                Capture / Upload
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {previewUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt="preview"
                                            className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Purchase Date & Warranty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Date
                            </label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={form.purchase_date}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Warranty Expiry
                            </label>
                            <input
                                type="date"
                                name="warranty_expiry"
                                value={form.warranty_expiry}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Unit Assignment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign to Unit (optional)
                        </label>
                        <select
                            name="unit_id"
                            value={form.unit_id}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">— Shared Property Asset —</option>
                            {units.map((u) => (
                                <option key={u.unit_id} value={u.unit_id}>
                                    {u.unit_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Condition & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condition
                            </label>
                            <select
                                name="condition"
                                value={form.condition}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="good">Good</option>
                                <option value="needs_repair">Needs Repair</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="under_maintenance">Under Maintenance</option>
                                <option value="retired">Retired</option>
                                <option value="disposed">Disposed</option>
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="w-full sm:w-auto px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-5 py-2.5 text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg font-medium hover:opacity-90 transition"
                        >
                            {loading ? "Saving..." : "Save Asset"}
                        </button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
}
