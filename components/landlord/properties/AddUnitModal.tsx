"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import { mutate } from "swr";
import Swal from "sweetalert2";

type UnitRow = {
    id: string;
    unit_name: string;
    unit_size: string;
    rent_amount: string;
    furnish: string;
    photo: File | null;
    photoPreview: string | null;
    nameError?: string;
};

type Props = {
    property_id: string;
    landlord_id: string;
    onClose: () => void;
    onSuccess?: () => void;
};

export default function AddUnitModal({ property_id, landlord_id, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<UnitRow[]>([
        { id: "1", unit_name: "", unit_size: "", rent_amount: "", furnish: "unfurnished", photo: null, photoPreview: null, nameError: "" }
    ]);

    // Check unit name when typed (debounced)
    useEffect(() => {
        const timers = units.map(unit => {
            // Clear error if field is empty
            if (!unit.unit_name.trim()) {
                setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, nameError: "" } : u));
                return null;
            }
            return setTimeout(async () => {
                try {
                    const res = await axios.get(
                        `/api/unitListing/checkUnitName?property_id=${property_id}&unitName=${encodeURIComponent(unit.unit_name.trim())}`
                    );
                    setUnits(prev => prev.map(u => u.id === unit.id ? { 
                        ...u, 
                        nameError: res.data.exists ? "Unit name already exists" : "" 
                    } : u));
                } catch {
                    setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, nameError: "" } : u));
                }
            }, 500);
        });
        return () => timers.forEach(t => t && clearTimeout(t));
    }, [units.map(u => u.unit_name).join(","), property_id]);

    const addRow = () => {
        setUnits([...units, { 
            id: Date.now().toString(), 
            unit_name: "", 
            unit_size: "", 
            rent_amount: "", 
            furnish: "unfurnished", 
            photo: null, 
            photoPreview: null,
            nameError: "" 
        }]);
    };

    const removeRow = (id: string) => {
        if (units.length === 1) return;
        setUnits(units.filter(u => u.id !== id));
    };

    const updateUnit = (id: string, field: keyof UnitRow, value: any) => {
        setUnits(units.map(u => u.id === id ? { ...u, [field]: value } : u));
    };

    const handlePhotoChange = (id: string, file: File | null) => {
        if (file) {
            const preview = URL.createObjectURL(file);
            setUnits(units.map(u => u.id === id ? { ...u, photo: file, photoPreview: preview } : u));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check for name errors from useEffect
        const hasErrors = units.some(u => u.nameError);
        if (hasErrors) {
            Swal.fire({ icon: "error", title: "Name Error", text: "Please fix unit name errors before saving." });
            return;
        }

        // Check duplicate names within the form
        const names = units.map(u => u.unit_name.trim()).filter(Boolean);
        const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
        if (duplicates.length > 0) {
            Swal.fire({ icon: "warning", title: "Duplicate Names", text: `Unit names "${duplicates.join(', ')}" are duplicated.` });
            return;
        }

        const validUnits = units.filter(u => u.unit_name.trim() && u.unit_size.trim() && u.rent_amount.trim());
        if (validUnits.length === 0) {
            Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill in unit name, size, and rent for at least one unit." });
            return;
        }

        setLoading(true);

        try {
            for (const unit of validUnits) {
                const formData = new FormData();
                formData.append("property_id", property_id);
                formData.append("landlord_id", landlord_id);
                formData.append("unit_name", unit.unit_name);
                formData.append("unit_size", unit.unit_size);
                formData.append("rent_amount", unit.rent_amount);
                formData.append("furnish", unit.furnish);
                formData.append("status", "available");
                if (unit.photo) {
                    formData.append("photo", unit.photo);
                }

                await axios.post("/api/unitListing/addUnit", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            mutate(`/api/unitListing/getUnitListings?property_id=${property_id}`);

            Swal.fire({ icon: "success", title: "Units Added", text: `${validUnits.length} unit(s) created successfully.` });
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error(error);
            Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.message || "Failed to add units." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-2">
            <div className="w-full sm:w-auto sm:min-w-[400px] sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                    <h3 className="font-bold text-base">Add Units</h3>
                    <button onClick={onClose} className="p-1.5 -mr-1 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {units.map((unit, index) => (
                        <div key={unit.id} className="bg-gray-50 rounded-xl p-3 space-y-3 relative">
                            {units.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeRow(unit.id)}
                                    className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            <div className="text-xs font-semibold text-gray-600 mb-2">Unit {index + 1}</div>

                            {/* Unit Name */}
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Unit Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={unit.unit_name}
                                    onChange={(e) => updateUnit(unit.id, "unit_name", e.target.value)}
                                    placeholder="e.g., Unit 101"
                                    className={`w-full px-3 py-2 rounded-lg border bg-white focus:ring-2 text-sm ${
                                        unit.nameError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                                    }`}
                                />
                                {unit.nameError && (
                                    <p className="text-[10px] text-red-500 mt-1">{unit.nameError}</p>
                                )}
                            </div>

                            {/* Size & Rent */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Size (sqm) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={unit.unit_size}
                                        onChange={(e) => updateUnit(unit.id, "unit_size", e.target.value)}
                                        placeholder="25"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Rent (₱) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={unit.rent_amount}
                                        onChange={(e) => updateUnit(unit.id, "rent_amount", e.target.value)}
                                        placeholder="15000"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Furnish */}
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Furnish</label>
                                <select
                                    value={unit.furnish}
                                    onChange={(e) => updateUnit(unit.id, "furnish", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="unfurnished">Unfurnished</option>
                                    <option value="semi-furnished">Semi-Furnished</option>
                                    <option value="furnished">Furnished</option>
                                </select>
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoChange(unit.id, e.target.files?.[0] || null)}
                                    className="hidden"
                                    id={`photo-${unit.id}`}
                                />
                                <label
                                    htmlFor={`photo-${unit.id}`}
                                    className="block border-2 border-dashed border-gray-300 rounded-lg p-2 text-center cursor-pointer hover:border-blue-500 transition-colors"
                                >
                                    {unit.photoPreview ? (
                                        <div className="relative">
                                            <img src={unit.photoPreview} alt="Preview" className="w-full h-20 object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); updateUnit(unit.id, "photo", null); updateUnit(unit.id, "photoPreview", null); }}
                                                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-2">
                                            <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                            <span className="text-[10px] text-gray-500">Click to upload</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    ))}

                    {/* Add Another */}
                    <button
                        type="button"
                        onClick={addRow}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Another Unit
                    </button>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold disabled:opacity-50"
                        >
                            {loading ? "Saving..." : `Add ${units.length} Unit${units.length > 1 ? "s" : ""}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
