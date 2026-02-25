"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Plus, Trash2, Repeat } from "lucide-react";

interface RecurringChargesProps {
    propertyId: string;
}

interface Charge {
    id?: number;
    name: string;
    amount: number;
    active: boolean;
}

export default function RecurringCharges({
                                             propertyId,
                                         }: RecurringChargesProps) {
    const [charges, setCharges] = useState<Charge[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCharges();
    }, [propertyId]);

    const fetchCharges = async () => {
        try {
            const res = await axios.get(
                `/api/properties/recurring-charges?property_id=${propertyId}`
            );
            setCharges(res.data || []);
        } catch (err) {
            console.error("Failed to fetch recurring charges:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCharges([
            ...charges,
            {
                name: "",
                amount: 0,
                active: true,
            },
        ]);
    };

    const handleChange = (
        index: number,
        field: keyof Charge,
        value: any
    ) => {
        const updated = [...charges];
        updated[index][field] = value;
        setCharges(updated);
    };

    const handleRemove = (index: number) => {
        const updated = [...charges];
        updated.splice(index, 1);
        setCharges(updated);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.post("/api/properties/recurring-charges", {
                property_id: propertyId,
                charges,
            });

            Swal.fire(
                "Saved!",
                "Monthly recurring charges updated successfully.",
                "success"
            );
        } catch (err) {
            Swal.fire(
                "Error",
                "Failed to save recurring charges.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="py-6 text-sm text-gray-500">
                Loading recurring charges...
            </div>
        );

    return (
        <div
            id="recurring-charges-section"
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Repeat className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Monthly Recurring Charges
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                            These charges will automatically be added to every active tenant’s monthly billing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                {charges.length === 0 && (
                    <div className="text-sm text-gray-500">
                        No recurring charges added yet.
                    </div>
                )}

                {charges.map((charge, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-5 gap-3 border p-4 rounded-lg bg-gray-50"
                    >
                        <input
                            type="text"
                            placeholder="Charge name (e.g. Garbage Fee)"
                            value={charge.name}
                            onChange={(e) =>
                                handleChange(index, "name", e.target.value)
                            }
                            className="md:col-span-3 rounded-lg border px-3 py-2 text-sm"
                        />

                        <input
                            type="number"
                            placeholder="Amount (₱)"
                            value={charge.amount}
                            min="0"
                            step="0.01"
                            onChange={(e) =>
                                handleChange(index, "amount", Number(e.target.value))
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                        />

                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="flex items-center justify-center text-red-500 hover:text-red-700"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Add Charge
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Charges"}
                    </button>
                </div>
            </div>
        </div>
    );
}