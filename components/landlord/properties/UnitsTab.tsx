"use client";

// for landlord

import React from "react";
import {
    HomeIcon,
    PencilSquareIcon,
    TrashIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
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

const UnitsTab: React.FC<UnitsTabProps> = ({
                                               units,
                                               isLoading,
                                               unitBillingStatus,
                                               billingMode,
                                               propertyId,
                                               propertyDetails,
                                               handleEditUnit,
                                               handleDeleteUnit,
                                               handleAddUnitClick,
                                           }) => {
    const router = useRouter();

    return (
        <div className="p-4 sm:p-6">
            {/* Loading Skeleton */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse bg-white border border-gray-200 rounded-xl h-20"
                        ></div>
                    ))}
                </div>
            ) : units && units.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm overflow-hidden">
                    {units.map((unit) => (
                        <div
                            key={unit.unit_id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                            {/* Left Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
                                <div className="flex items-center gap-3 min-w-[180px]">
                                    <div className="h-10 w-10 flex items-center justify-center bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full">
                                        <HomeIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            {unit.unit_name || "Untitled Unit"}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {unit.status === "occupied"
                                                ? "Occupied"
                                                : "Vacant / Available"}
                                        </p>
                                    </div>
                                </div>

                                <div className="hidden sm:flex flex-col min-w-[140px]">
                                    <p className="text-xs text-gray-500">Monthly Rent</p>
                                    <p className="font-medium text-indigo-600">
                                        ₱{Number(unit.rent_amount || 0).toLocaleString()}
                                    </p>
                                </div>

                                <div className="hidden sm:flex flex-col min-w-[140px]">
                                    <p className="text-xs text-gray-500">Tenant</p>
                                    <p className="font-medium text-gray-700">
                                        {unit.tenant_name || "—"}
                                    </p>
                                </div>

                                <div className="flex flex-col min-w-[160px]">
                                    <p className="text-xs text-gray-500">Last Updated</p>
                                    <div className="flex items-center gap-1 text-sm text-gray-700">
                                        <ClockIcon className="h-4 w-4 text-gray-400" />
                                        <span>
      {unit.last_updated
          ? new Date(unit.last_updated).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
          : "N/A"}
    </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section */}
                            <div className="mt-3 sm:mt-0 flex items-center gap-3 flex-shrink-0">
                <span
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        unit.status === "occupied"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {unit.status === "occupied" ? "Occupied" : "Vacant"}
                </span>

                                <button
                                    onClick={() =>
                                        router.push(
                                            `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                                        )
                                    }
                                    className="text-sm font-medium text-indigo-600 hover:underline"
                                >
                                    View
                                </button>

                                <button
                                    onClick={() => handleEditUnit(unit.unit_id)}
                                    className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-600"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => handleDeleteUnit(unit.unit_id)}
                                    className="p-1.5 rounded-md hover:bg-red-50 text-red-600"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="bg-white p-3 rounded-2xl shadow-md mb-3">
                        <HomeIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg font-semibold mb-1.5">
                        No Units Available
                    </p>
                    <p className="text-gray-400 text-sm mb-4 text-center max-w-sm">
                        Start building your rental portfolio by adding your first unit.
                    </p>
                    <button
                        className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 rounded-lg shadow-md transition"
                        onClick={handleAddUnitClick}
                    >
                        + Add Your First Unit
                    </button>
                </div>
            )}
        </div>
    );
};

export default UnitsTab;
