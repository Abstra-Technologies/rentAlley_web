"use client";

import React from "react";
import { Home, Edit2, Trash2, Eye, DollarSign, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

interface UnitsTabProps {
    units: any[];
    isLoading: boolean;
    propertyId: string | number;
    handleEditUnit: (unitId: number) => void;
    handleDeleteUnit: (unitId: number) => void;
    handleAddUnitClick: () => void;
    onPublishToggle: (unitId: number, publish: boolean) => void;
}

const UnitsTab: React.FC<UnitsTabProps> = ({
                                               units,
                                               isLoading,
                                               propertyId,
                                               handleEditUnit,
                                               handleDeleteUnit,
                                               handleAddUnitClick,
    onPublishToggle
                                           }) => {
    const router = useRouter();

    // 🧩 Helper function to check if unit is occupied
    const isOccupied = (status: string) => status?.toLowerCase() === "occupied";

    // 🧠 Handle publish toggle
    const handleTogglePublish = async (
        unitId: number,
        currentValue: boolean
    ) => {
        const newValue = !currentValue;

        // 🚀 INSTANT UI UPDATE
        onPublishToggle(unitId, newValue);

        // 🔔 Non-blocking Swal toast (NO DELAY)
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: newValue ? "Unit published" : "Unit unlisted",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
        });

        try {
            await axios.put(`/api/unitListing/publish`, {
                unit_id: unitId,
                publish: newValue,
            });
        } catch (error) {
            console.error("Publish toggle failed:", error);

            // ❌ ROLLBACK UI
            onPublishToggle(unitId, currentValue);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Failed to update status",
                showConfirmButton: false,
                timer: 2000,
            });
        }
    };

    return (
        <div className="p-4 md:p-6">
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse bg-gray-100 rounded-lg h-24"
                        />
                    ))}
                </div>
            ) : units && units.length > 0 ? (
                <div className="space-y-4">

                    {/* ---------------- Desktop Header ---------------- */}
                    <div className="hidden md:flex items-center px-4 pb-2 border-b border-gray-200">
                        <div style={{ width: "calc(20% + 48px)" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Unit
                            </p>
                        </div>
                        <div style={{ width: "120px" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Rent
                            </p>
                        </div>
                        <div style={{ width: "100px" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Status
                            </p>
                        </div>
                        <div style={{ width: "120px" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Published
                            </p>
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Actions
                            </p>
                        </div>
                    </div>

                    {/* ---------------- Unit Cards ---------------- */}
                    <div className="space-y-3">
                        {units.map((unit) => {
                            const occupied = isOccupied(unit.status);

                            return (
                                <div
                                    key={unit.unit_id}
                                    className="bg-white rounded-xl border-2 border-gray-200
                  shadow-sm hover:shadow-md hover:border-gray-300
                  transition-all"
                                >
                                    {/* ---------------- Main Row ---------------- */}
                                    <div className="flex flex-col md:flex-row md:items-center p-3 md:p-4 gap-3">

                                        {/* Unit Info */}
                                        <div className="flex items-center gap-3 w-full md:w-[calc(20%+48px)]">
                                            <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Home className="h-5 w-5 text-blue-600" />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                                    {unit.unit_name || "Untitled Unit"}
                                                </h3>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {occupied && unit.tenant_name
                                                        ? `Tenant: ${unit.tenant_name}`
                                                        : "Available for rent"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rent (Desktop) */}
                                        <div className="hidden md:flex items-center w-[120px]">
                                            <p className="text-sm font-bold text-gray-900">
                                                ₱{Number(unit.rent_amount || 0).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Status (Desktop) */}
                                        <div className="hidden md:flex items-center w-[100px]">
                    <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize
                        ${
                            unit.status === "occupied"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : unit.status === "reserved"
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : unit.status === "unoccupied"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                    >
                      {unit.status}
                    </span>
                                        </div>

                                        {/* Publish Toggle (Desktop) */}
                                        <div className="hidden md:flex items-center justify-center w-[120px]">
                                            <button
                                                onClick={() =>
                                                    handleTogglePublish(unit.unit_id, !!unit.publish)
                                                }
                                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition
                        ${
                                                    unit.publish
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200"
                                                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                                                }`}
                                            >
                                                <Globe className="h-4 w-4 inline mr-1" />
                                                {unit.publish ? "Published" : "Hidden"}
                                            </button>
                                        </div>

                                        {/* Actions (Desktop) */}
                                        <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                                                    )
                                                }
                                                className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <Eye className="w-4 h-4 inline mr-1" />
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditUnit(unit.unit_id)}
                                                className="px-3 py-1.5 rounded-lg text-sm text-orange-600 hover:bg-orange-50"
                                            >
                                                <Edit2 className="w-4 h-4 inline mr-1" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUnit(unit.unit_id)}
                                                className="px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 inline mr-1" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* ---------------- Slim Mobile Stack ---------------- */}
                                    <div className="md:hidden border-t border-gray-100 px-3 py-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-[11px] text-gray-500">Monthly Rent</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    ₱{Number(unit.rent_amount || 0).toLocaleString()}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    handleTogglePublish(unit.unit_id, !!unit.publish)
                                                }
                                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border
                        ${
                                                    unit.publish
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                        : "bg-gray-50 text-gray-600 border-gray-300"
                                                }`}
                                            >
                                                {unit.publish ? "Published" : "Hidden"}
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                                                    )
                                                }
                                                className="flex-1 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditUnit(unit.unit_id)}
                                                className="flex-1 py-1.5 rounded-md text-xs font-semibold text-orange-600 border border-orange-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUnit(unit.unit_id)}
                                                className="flex-1 py-1.5 rounded-md text-xs font-semibold text-red-600 border border-red-200"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <Home className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-gray-900 text-lg font-semibold mb-1">
                        No Units Available
                    </p>
                    <p className="text-gray-500 text-sm mb-5 text-center max-w-sm">
                        Start building your rental portfolio by adding your first unit.
                    </p>
                    <button
                        onClick={handleAddUnitClick}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
            bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg shadow-md"
                    >
                        <Home className="w-4 h-4" />
                        Add Your First Unit
                    </button>
                </div>
            )}
        </div>
    );

};

export default UnitsTab;

