"use client";

import React from "react";
import { DollarSign, Check } from "lucide-react";

export default function BillingSummary({
  bill,
  unit,
  property,
  extraExpenses,
  discounts,
  pdc,
  loadingPdc,
}: any) {
  const fmtPHP = (n: number | string) =>
    Number(n || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // 🛑 Prevent reading null property/unit
  if (!property || !unit) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 text-center text-sm text-gray-500">
        Loading billing summary…
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-emerald-600" />
        Billing Summary
      </h3>

      <div className="space-y-4 text-sm">

        {/* ====================== UTILITIES ====================== */}
        {(property?.water_billing_type === "submetered" ||
          property?.electricity_billing_type === "submetered") && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-cyan-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-cyan-800 mb-3">
              Utility Consumption
            </h4>

            <div className="divide-y divide-cyan-100">

              {property?.water_billing_type === "submetered" && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    Water ({bill?.waterUsage ?? 0} m³)
                  </span>
                  <span className="font-semibold">
                    ₱{fmtPHP(bill?.waterCost ?? 0)}
                  </span>
                </div>
              )}

              {property?.electricity_billing_type === "submetered" && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    Electricity ({bill?.elecUsage ?? 0} kWh)
                  </span>
                  <span className="font-semibold">
                    ₱{fmtPHP(bill?.elecCost ?? 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================== FIXED CHARGES ====================== */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Fixed Charges
          </h4>

          <div className="divide-y divide-gray-200">
            <div className="flex justify-between py-2 text-sm">
              <span>🏠 Rent</span>
              <span className="font-semibold">
                ₱
                {fmtPHP(
                  unit?.effective_rent_amount ??
                    unit?.rent_amount ??
                    0
                )}
              </span>
            </div>

            <div className="flex justify-between py-2 text-sm">
              <span>🏢 Assoc. Dues</span>
              <span className="font-semibold">
                ₱{fmtPHP(bill?.dues ?? 0)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  ⏰ Late Fee
                </span>
                <span className="text-xs text-gray-500 italic">
                  (for reference only)
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ₱{fmtPHP(bill?.lateFee ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* ====================== ADJUSTMENTS ====================== */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-3">
            Adjustments
          </h4>

          <div className="divide-y divide-amber-100">

            <div className="flex justify-between py-2 text-sm">
              <span>📦 Additional Charges</span>
              <span className="font-semibold">
                ₱{fmtPHP(bill?.totalExtraCharges ?? 0)}
              </span>
            </div>

            <div className="flex justify-between py-2 text-sm">
              <span>🎁 Discounts</span>
              <span className="text-emerald-600 font-semibold">
                -₱{fmtPHP(bill?.totalDiscounts ?? 0)}
              </span>
            </div>

          </div>
        </div>

        {/* ====================== TOTAL / PDC ====================== */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg p-5 shadow-sm">
          <div className="flex flex-col gap-2">

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold opacity-90">
                Total Billing Amount
              </span>
              <span className="text-base font-bold">
                ₱{fmtPHP(bill?.totalBeforePdc ?? 0)}
              </span>
            </div>

            <div className="h-px bg-white/30 my-1"></div>

            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total Amount Due</span>
              <span className="text-2xl font-extrabold">
                ₱
                {fmtPHP(
                  pdc?.status === "cleared"
                    ? bill?.adjustedTotal
                    : bill?.totalBeforePdc
                )}
              </span>
            </div>

            {pdc && (
              <p className="mt-2 text-xs italic text-white/90">
                {pdc.status === "cleared"
                  ? `✅ Cleared PDC applied — ₱${fmtPHP(
                      bill?.pdcCoveredAmount ?? 0
                    )} deducted from rent.`
                  : `⚠️ PDC not cleared — full rent amount still included.`}
              </p>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
