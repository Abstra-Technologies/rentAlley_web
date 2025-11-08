"use client";

import React from "react";
import { Home, Edit2, Trash2, Eye, User, DollarSign } from "lucide-react";
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

  // Helper function to check if unit is occupied (case-insensitive)
  const isOccupied = (status: string) => {
    return status?.toLowerCase() === "occupied";
  };

  return (
    <div className="p-4 md:p-6">
      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 rounded-lg h-24"
            ></div>
          ))}
        </div>
      ) : units && units.length > 0 ? (
        <div className="space-y-4">
          {/* Header Row - Desktop Only */}
          <div className="hidden md:flex items-center px-4 pb-2 border-b border-gray-200">
            {/* Unit Column */}
            <div style={{ width: "calc(25% + 48px)" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Unit
              </p>
            </div>

            {/* Monthly Rent Column */}
            <div style={{ width: "160px" }} className="flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Monthly Rent
              </p>
            </div>

            {/* Tenant Column */}
            <div style={{ width: "160px" }} className="flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tenant
              </p>
            </div>

            {/* Last Updated Column */}
            <div style={{ width: "140px" }} className="flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Last Updated
              </p>
            </div>

            {/* Status Column */}
            <div style={{ width: "100px" }} className="flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </p>
            </div>

            {/* Actions Column */}
            <div className="flex-1 text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </p>
            </div>
          </div>

          {/* Unit Cards */}
          <div className="space-y-3">
            {units.map((unit) => {
              const occupied = isOccupied(unit.status);

              return (
                <div
                  key={unit.unit_id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4">
                    {/* Unit Icon & Name */}
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

                    {/* Monthly Rent - Desktop */}
                    <div
                      className="hidden md:flex items-center gap-2 flex-shrink-0"
                      style={{ width: "160px" }}
                    >
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-bold text-gray-900">
                        ₱{Number(unit.rent_amount || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Tenant - Desktop */}
                    <div
                      className="hidden md:flex items-center gap-2 flex-shrink-0"
                      style={{ width: "160px" }}
                    >
                      <User className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {unit.tenant_name || "—"}
                      </p>
                    </div>

                    {/* Last Updated - Desktop */}
                    <div
                      className="hidden md:flex items-center flex-shrink-0"
                      style={{ width: "140px" }}
                    >
                      <p className="text-xs text-gray-700">
                        {unit.last_updated
                          ? new Date(unit.last_updated).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "N/A"}
                      </p>
                    </div>

                    {/* Status - Desktop */}
                    <div
                      className="hidden md:flex items-center flex-shrink-0"
                      style={{ width: "100px" }}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          occupied
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {occupied ? "Occupied" : "Vacant"}
                      </span>
                    </div>

                    {/* Actions - Desktop Only (Right Edge) */}
                    <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
                      <button
                        onClick={() =>
                          router.push(
                            `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden lg:inline">View</span>
                      </button>
                      <button
                        onClick={() => handleEditUnit(unit.unit_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden lg:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.unit_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden lg:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Analytics */}
                  <div className="md:hidden border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Monthly Rent</p>
                          <p className="text-sm font-bold text-gray-900">
                            ₱{Number(unit.rent_amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge - Mobile */}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          occupied
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {occupied ? "Occupied" : "Vacant"}
                      </span>
                    </div>

                    {/* Actions - Mobile */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/pages/landlord/properties/${propertyId}/units/details/${unit.unit_id}`
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleEditUnit(unit.unit_id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors border border-orange-200"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.unit_id)}
                        className="flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
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
