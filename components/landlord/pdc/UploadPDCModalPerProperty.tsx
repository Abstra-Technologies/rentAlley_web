"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { X, PlusCircle, Trash2, Upload } from "lucide-react";

interface UploadPDCModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: number;
    onSuccess?: () => void;
}

interface LeaseOption {
    lease_id: number;
    unit_name: string;
    tenant_name: string;
    rent_amount: number;
}

interface PDCEntry {
    check_number: string;
    bank_name: string;
    amount: string;
    due_date: string;
    notes?: string;
    uploaded_image: File | null;
}

export default function UploadPDCModal({
                                           isOpen,
                                           onClose,
                                           propertyId,
                                           onSuccess,
                                       }: UploadPDCModalProps) {
    const [leases, setLeases] = useState<LeaseOption[]>([]);
    const [selectedLease, setSelectedLease] = useState<string>("");
    const [pdcList, setPdcList] = useState<PDCEntry[]>([
        {
            check_number: "",
            bank_name: "",
            amount: "",
            due_date: "",
            notes: "",
            uploaded_image: null,
        },
    ]);
    const [uploading, setUploading] = useState(false);
    const [loadingLeases, setLoadingLeases] = useState(true);

    if (!isOpen) return null;

    // 🔹 Fetch leases for the property
    useEffect(() => {
        if (!propertyId) return;
        const fetchLeases = async () => {
            setLoadingLeases(true);
            try {
                const { data } = await axios.get(
                    `/api/landlord/activeLease/getByProperty?property_id=${propertyId}`
                );
                setLeases(Array.isArray(data.leases) ? data.leases : []);
            } catch (err) {
                console.error("Failed to fetch leases:", err);
                Swal.fire("Error", "Failed to load lease options.", "error");
                setLeases([]);
            } finally {
                setLoadingLeases(false);
            }
        };
        fetchLeases();
    }, [propertyId]);

    // 🔹 Handle changes
    const handleAddRow = () => {
        const first = pdcList[0];
        setPdcList([
            ...pdcList,
            {
                check_number: "",
                bank_name: first.bank_name, // auto-fill
                amount: first.amount, // auto-fill
                due_date: "",
                notes: "",
                uploaded_image: null,
            },
        ]);
    };

    const handleRemoveRow = (index: number) => {
        setPdcList(pdcList.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof PDCEntry, value: any) => {
        const updated = [...pdcList];
        updated[index][field] = value;

        // 🪄 Auto-fill amount/bank name in all rows if user edits the first
        if (index === 0 && (field === "bank_name" || field === "amount")) {
            for (let i = 1; i < updated.length; i++) {
                if (field === "bank_name") updated[i].bank_name = value;
                if (field === "amount") updated[i].amount = value;
            }
        }

        setPdcList(updated);
    };

    const handleFileChange = (index: number, file: File | null) => {
        const updated = [...pdcList];
        updated[index].uploaded_image = file;
        setPdcList(updated);
    };

    // 🔹 Submit handler
    const handleSubmit = async () => {
        if (!propertyId) {
            Swal.fire("Missing Info", "Property ID is required.", "warning");
            return;
        }
        if (!selectedLease) {
            Swal.fire("Missing Lease", "Please select a lease.", "warning");
            return;
        }

        const validPDCs = pdcList.filter(
            (p) =>
                p.check_number &&
                p.bank_name &&
                p.amount &&
                p.due_date
        );

        if (validPDCs.length === 0) {
            Swal.fire("Incomplete", "Please fill out all required PDC fields.", "warning");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("property_id", String(propertyId));

            validPDCs.forEach((pdc, i) => {
                formData.append(`pdcs[${i}][lease_id]`, selectedLease);
                formData.append(`pdcs[${i}][check_number]`, pdc.check_number);
                formData.append(`pdcs[${i}][bank_name]`, pdc.bank_name);
                formData.append(`pdcs[${i}][amount]`, pdc.amount);
                formData.append(`pdcs[${i}][due_date]`, pdc.due_date);
                formData.append(`pdcs[${i}][notes]`, pdc.notes || "");
                formData.append(`pdcs[${i}][uploaded_image]`, pdc.uploaded_image!);
            });

            await axios.post("/api/landlord/pdc/uploadPerProperty", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire("Success", "PDCs uploaded successfully!", "success");
            setPdcList([
                {
                    check_number: "",
                    bank_name: "",
                    amount: "",
                    due_date: "",
                    notes: "",
                    uploaded_image: null,
                },
            ]);
            setSelectedLease("");
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error(error);
            Swal.fire("Error", "Failed to upload PDCs.", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-600 to-emerald-600">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5" /> Upload Post-Dated Check(s)
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 max-h-[70vh] overflow-y-auto space-y-6">
                    {loadingLeases ? (
                        <p className="text-center text-gray-500">Loading leases...</p>
                    ) : leases.length === 0 ? (
                        <p className="text-center text-gray-500">
                            No active leases found for this property.
                        </p>
                    ) : (
                        <>
                            {/* Lease Select (only once) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Lease / Unit
                                </label>
                                <select
                                    value={selectedLease}
                                    onChange={(e) => setSelectedLease(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">-- Select Lease --</option>
                                    {leases.map((l) => (
                                        <option key={l.lease_id} value={l.lease_id}>
                                            🏠 {l.unit_name} — {l.tenant_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* PDC Rows */}
                            {pdcList.map((pdc, index) => (
                                <div
                                    key={index}
                                    className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative"
                                >
                                    <div className="absolute top-2 right-2">
                                        {pdcList.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveRow(index)}
                                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Check Number
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={pdc.check_number}
                                                onChange={(e) =>
                                                    handleChange(index, "check_number", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Bank Name
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={pdc.bank_name}
                                                onChange={(e) =>
                                                    handleChange(index, "bank_name", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={pdc.amount}
                                                onChange={(e) =>
                                                    handleChange(index, "amount", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Issue Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={pdc.due_date}
                                                onChange={(e) =>
                                                    handleChange(index, "due_date", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Notes (optional)
                                            </label>
                                            <textarea
                                                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                rows={2}
                                                value={pdc.notes}
                                                onChange={(e) =>
                                                    handleChange(index, "notes", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Upload Image (Check Photo)
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    handleFileChange(index, e.target.files?.[0] || null)
                                                }
                                                className="w-full mt-1"
                                            />
                                            {pdc.uploaded_image && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {pdc.uploaded_image.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add More */}
                            <button
                                onClick={handleAddRow}
                                className="flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Add Another PDC
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium hover:from-blue-700 hover:to-emerald-700 shadow-md disabled:opacity-50"
                    >
                        {uploading ? "Uploading..." : "Upload PDCs"}
                    </button>
                </div>
            </div>
        </div>
    );
}
