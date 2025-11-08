"use client";

import React from "react";
import { Home, Edit2, Trash2, Clock, Eye } from "lucide-react";
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
        <div className="space-y-3">
          {units.map((unit) => (
            <div
              key={unit.unit_id}
              className="bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                {/* Left Section - Unit Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {unit.unit_name || "Untitled Unit"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {unit.status === "occupied" ? "Occupied" : "Available"}
                    </p>
                  </div>
                </div>

                {/* Middle Section - Details (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Monthly Rent</p>
                    <p className="font-semibold text-blue-600">
                      ₱{Number(unit.rent_amount || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Tenant</p>
                    <p className="font-medium text-gray-700 truncate max-w-[120px]">
                      {unit.tenant_name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs">
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
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Status & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      unit.status === "occupied"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden lg:inline">View</span>
                  </button>

                  <button
                    onClick={() => handleEditUnit(unit.unit_id)}
                    className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteUnit(unit.unit_id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Details - Show below on mobile */}
              <div className="md:hidden flex items-center justify-around border-t border-gray-100 px-4 py-3 bg-gray-50 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Rent</p>
                  <p className="font-semibold text-blue-600">
                    ₱{Number(unit.rent_amount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <p className="text-xs text-gray-500">Tenant</p>
                  <p className="font-medium text-gray-700">
                    {unit.tenant_name || "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
