"use client";

import React, { useState } from "react";
import { Home, Edit2, Trash2, Eye, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

interface UnitsTabProps {
    units: any[];
    isLoading: boolean;
    unitBillingStatus: Record<number, boolean>;
    billingMode: boolean;
    propertyId: string | number;
    propertyDetails: any;
    handleEditUnit: (unitId: number) => void;
    handleDeleteUnit: (unitId: number) => void;
    handleAddUnitClick: () => void;
}

const UnitsTab: React.FC<UnitsTabProps> = ({
                                               units,
                                               isLoading,
                                               propertyId,
                                               handleEditUnit,
                                               handleDeleteUnit,
                                               handleAddUnitClick,
                                           }) => {
    const router = useRouter();
    const [localUnits, setLocalUnits] = useState(units || []);

    // ✅ Helper to check occupancy
    const isOccupied = (status: string) => status?.toLowerCase() === "occupied";

    // ✅ Toggle publish status
    const handleTogglePublish = async (unitId: string, currentValue: boolean) => {
        const newValue = !currentValue;

        // update immediately in UI for responsiveness
        setLocalUnits((prev) =>
            prev.map((u) =>
                u.unit_id === unitId ? { ...u, publish: newValue } : u
            )
        );

        try {
            await axios.put(`/api/unitListing/publish`, {
                unit_id: unitId,
                publish: newValue,
            });

            Swal.fire({
                toast: true,
                position: "bottom-end",
                showConfirmButton: false,
                timer: 1800,
                icon: "success",
                title: newValue ? "Unit published!" : "Unit hidden.",
            });
        } catch (error) {
            console.error("Publish toggle failed:", error);
            Swal.fire({
                title: "Error",
                text: "Failed to update publish status.",
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
            // rollback UI state
            setLocalUnits((prev) =>
                prev.map((u) =>
                    u.unit_id === unitId ? { ...u, publish: currentValue } : u
                )
            );
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
                        ></div>
                    ))}
                </div>
            ) : localUnits && localUnits.length > 0 ? (
                <div className="space-y-4">
                    {/* Header Row - Desktop */}
                    <div className="hidden md:flex items-center px-4 pb-2 border-b border-gray-200">
                        <div style={{ width: "calc(25% + 48px)" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Unit
                            </p>
                        </div>
                        <div style={{ width: "140px" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Rent
                            </p>
                        </div>
                        <div style={{ width: "140px" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Tenant
                            </p>
                        </div>
                        <div style={{ width: "100px" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </p>
                        </div>
                        <div style={{ width: "110px" }}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Published
                            </p>
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Actions
                            </p>
                        </div>
                    </div>

                    {/* Unit Rows */}
                    <div className="space-y-3">
                        {localUnits.map((unit) => {
                            const occupied = isOccupied(unit.status);

                            return (
                                <div
                                    key={unit.unit_id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4">
                                        {/* Unit Info */}
                                        <div
                                            className="flex items-center gap-3"
                                            style={{ width: "calc(25% + 48px)" }}
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Home className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                                                    {unit.unit_name || "Untitled Unit"}
                                                </h3>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {occupied && unit.tenant_name
                                                        ? `Tenant: ${unit.tenant_name}`
                                                        : "Available for rent"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rent */}
                                        <div
                                            className="hidden md:flex items-center gap-2 flex-shrink-0"
                                            style={{ width: "140px" }}
                                        >
                                            <p className="text-sm font-bold text-gray-900">
                                                ₱{Number(unit.rent_amount || 0).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Tenant */}
                                        <div
                                            className="hidden md:flex items-center gap-2 flex-shrink-0"
                                            style={{ width: "140px" }}
                                        >
                                            <p className="text-sm text-gray-700 truncate">
                                                {unit.tenant_name || "—"}
                                            </p>
                                        </div>

                                        {/* Status */}
                                        <div
                                            className="hidden md:flex items-center"
                                            style={{ width: "100px" }}
                                        >
                      <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border capitalize
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
                        {unit.status || "Unknown"}
                      </span>
                                        </div>

                                        {/* ✅ Publish Toggle */}
                                        <div
                                            className="hidden md:flex items-center justify-center"
                                            style={{ width: "110px" }}
                                        >
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={!!unit.publish}
                                                    onChange={() =>
                                                        handleTogglePublish(unit.unit_id, !!unit.publish)
                                                    }
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-500 transition-all duration-300"></div>
                                                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-5"></div>
                                            </label>
                                        </div>

                                        {/* Actions */}
                                        <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                                                    )
                                                }
                                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                                            >
                                                <Eye className="w-4 h-4 inline-block mr-1" />
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditUnit(unit.unit_id)}
                                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-orange-600 border border-orange-200 hover:bg-orange-50 transition"
                                            >
                                                <Edit2 className="w-4 h-4 inline-block mr-1" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUnit(unit.unit_id)}
                                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
                                            >
                                                <Trash2 className="w-4 h-4 inline-block mr-1" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mobile Layout */}
                                    <div className="md:hidden border-t border-gray-100 px-4 py-3 bg-gray-50">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <p className="text-xs text-gray-600">Monthly Rent</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    ₱{Number(unit.rent_amount || 0).toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Mobile toggle */}
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={!!unit.publish}
                                                    onChange={() =>
                                                        handleTogglePublish(unit.unit_id, !!unit.publish)
                                                    }
                                                />
                                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-500 transition-all duration-300"></div>
                                                <div className="absolute left-1 top-1 bg-white w-3.5 h-3.5 rounded-full transition-all duration-300 peer-checked:translate-x-4"></div>
                                            </label>
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                                                    )
                                                }
                                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditUnit(unit.unit_id)}
                                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-orange-600 border border-orange-200 hover:bg-orange-50 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUnit(unit.unit_id)}
                                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
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
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 rounded-lg shadow-md transition-all"
                        onClick={handleAddUnitClick}
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
