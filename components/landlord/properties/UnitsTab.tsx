"use client";

import React from "react";
import { Home, Edit2, Trash2, Eye, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

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

const statusClass = (status: string) => {
    switch (status) {
        case "occupied":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "reserved":
            return "bg-orange-50 text-orange-700 border-orange-200";
        case "unoccupied":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "inactive":
            return "bg-gray-100 text-gray-700 border-gray-200";
        case "archived":
            return "bg-red-50 text-red-700 border-red-200";
        default:
            return "bg-gray-50 text-gray-600 border-gray-200";
    }
};

export default function UnitsTab({
                                     units,
                                     isLoading,
                                     propertyId,
                                     handleEditUnit,
                                     handleDeleteUnit,
                                     handleAddUnitClick,
                                 }: UnitsTabProps) {
    const router = useRouter();

    /* ================= LOADING ================= */
    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

    /* ================= EMPTY ================= */
    if (!units || units.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <Home className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                    No Units Available
                </p>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                    Start building your rental portfolio.
                </p>
                <button
                    onClick={handleAddUnitClick}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold shadow"
                >
                    Add Your First Unit
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-4">

            {/* ================= DESKTOP HEADER ================= */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-4 pb-2 border-b text-xs font-semibold text-gray-500 uppercase">
                <div>Unit</div>
                <div>Monthly Rent</div>
                <div>Tenant</div>
                <div>Last Updated</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
            </div>

            {/* ================= ROWS ================= */}
            {units.map((unit) => (
                <div
                    key={unit.unit_id}
                    className="bg-white border rounded-lg hover:shadow-sm transition overflow-hidden"
                >
                    {/* DESKTOP ROW */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 items-center px-4 py-3">
                        {/* Unit */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Home className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="truncate">
                                <p className="font-semibold text-gray-900 truncate">
                                    {unit.unit_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {unit.tenant_name || "Available"}
                                </p>
                            </div>
                        </div>

                        {/* Rent */}
                        <div className="font-bold text-gray-900">
                            ₱{Number(unit.rent_amount || 0).toLocaleString()}
                        </div>

                        {/* Tenant */}
                        <div className="truncate text-sm">
                            {unit.tenant_name || "—"}
                        </div>

                        {/* Updated */}
                        <div className="text-xs text-gray-600">
                            {unit.last_updated
                                ? new Date(unit.last_updated).toLocaleDateString()
                                : "—"}
                        </div>

                        {/* Status */}
                        <span
                            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${statusClass(
                                unit.status
                            )}`}
                        >
              {unit.status}
            </span>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() =>
                                    router.push(
                                        `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                                    )
                                }
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleEditUnit(unit.unit_id)}
                                className="px-3 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteUnit(unit.unit_id)}
                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* MOBILE CARD */}
                    <div className="md:hidden p-4 space-y-3">
                        <div className="flex justify-between">
                            <p className="font-semibold">{unit.unit_name}</p>
                            <span
                                className={`px-2 py-1 text-xs rounded-full border ${statusClass(
                                    unit.status
                                )}`}
                            >
                {unit.status}
              </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Rent</span>
                            <span className="font-bold">
                ₱{Number(unit.rent_amount || 0).toLocaleString()}
              </span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    router.push(
                                        `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                                    )
                                }
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                            >
                                View
                            </button>
                            <button
                                onClick={() => handleEditUnit(unit.unit_id)}
                                className="px-4 py-2 border rounded-lg"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteUnit(unit.unit_id)}
                                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
