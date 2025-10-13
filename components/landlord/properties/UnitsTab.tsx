"use client";
import React from "react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { FaCheckCircle } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LandlordUnitStatusBanner from "./UnitOccupancyStatusBar";

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
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-sm">
          <HomeIcon className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Available Units</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-2xl h-48"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : units && units.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {units.map((unit) => (
            <div
              key={unit?.unit_id}
              className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Header */}
              <div className="relative">
                <div className="h-32 sm:h-36 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <HomeIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2" />
                    <h3 className="text-lg sm:text-xl font-bold">
                      Unit {unit?.unit_name}
                    </h3>
                  </div>
                </div>

                {/* Lease Due Date Visual */}
                {unit?.next_due_date && (
                  <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold mr-2">
                      📅
                    </span>
                    <span className="text-sm text-gray-700 font-medium">
                      Billing Due Date:{" "}
                      <span className="text-gray-900 font-semibold">
                        {new Date(unit.next_due_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </span>
                  </div>
                )}

                {/* Billing Status */}
                {unitBillingStatus[unit.unit_id] && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full shadow-md">
                    <FaCheckCircle size={14} />
                    <span className="text-xs font-medium">Billed</span>
                  </div>
                )}

                {/* Occupancy Status - base on lease */}
                  <LandlordUnitStatusBanner
                      status={unit?.status}
                      hasPendingLease={unit?.hasPendingLease}
                  />

              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-800">Size:</span>{" "}
                    {unit?.unit_size} sqm
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/pages/landlord/property-listing/view-unit/${propertyId}/unit-details/${unit.unit_id}`
                      )
                    }
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm border border-gray-200"
                  >
                    View Unit Details
                  </button>
                </div>

                <hr className="border-gray-200 mb-4" />

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    className="w-full flex items-center justify-center px-3 py-2.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/pages/landlord/property-listing/view-unit/tenant-req/${unit.unit_id}`
                      );
                    }}
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    Prospective Leads
                  </button>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 p-2.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200"
                      onClick={() => handleEditUnit(unit.unit_id)}
                    >
                      <PencilSquareIcon className="h-4 w-4 mx-auto" />
                    </button>

                    <button
                      className="flex-1 p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
                      onClick={() => handleDeleteUnit(unit.unit_id)}
                    >
                      <TrashIcon className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>

                {/* Billing Actions */}
                {billingMode && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <Link
                      href={`/pages/landlord/billing/billingHistory/${unit.unit_id}`}
                    >
                      <button className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm font-medium">
                        Billing History
                      </button>
                    </Link>
                    <Link
                      href={`/pages/landlord/billing/payments/${unit.unit_id}`}
                    >
                      <button className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 text-sm font-medium">
                        View Payments
                      </button>
                    </Link>

                    {unitBillingStatus[unit.unit_id] ? (
                      propertyDetails?.water_billing_type !== "submetered" &&
                      propertyDetails?.electricity_billing_type !==
                        "submetered" ? (
                        <Link
                          href={`/pages/landlord/billing/viewUnitBill/${unit?.unit_id}`}
                        >
                          <button className="w-full bg-purple-50 text-purple-700 px-3 py-2 rounded-lg border border-purple-200 hover:bg-purple-100 text-sm font-medium">
                            View Bill
                          </button>
                        </Link>
                      ) : (
                        <Link
                          href={`/pages/landlord/billing/createUnitBill/${unit?.unit_id}`}
                        >
                          <button className="w-full bg-amber-50 text-amber-700 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 text-sm font-medium">
                            Edit Unit Bill
                          </button>
                        </Link>
                      )
                    ) : (
                      <Link
                        href={`/pages/landlord/billing/createUnitBill/${unit?.unit_id}`}
                      >
                        <button className="w-full bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100 text-sm font-medium">
                          Create Unit Bill
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
            <HomeIcon className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg font-semibold mb-2">
            No Units Available
          </p>
          <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
            Start building your rental portfolio by adding your first unit
          </p>
          <button
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl"
            onClick={handleAddUnitClick}
          >
            Add Your First Unit
          </button>
        </div>
      )}
    </div>
  );
};

export default UnitsTab;
