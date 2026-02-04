"use client";

import { useState } from "react";
import { Droplets, Zap, Info, X, Calculator } from "lucide-react";

interface UtilityRatesCardProps {
  property: any;
  propertyRates: any;
}

export default function UtilityRatesCard({
  property,
  propertyRates,
}: UtilityRatesCardProps) {
  const [open, setOpen] = useState<null | "water" | "electricity">(null);

  if (!property) return null;

  const hasWater = property?.water_billing_type === "submetered";
  const hasElectricity = property?.electricity_billing_type === "submetered";

  if (!hasWater && !hasElectricity) return null;

  /* Normalize from flat state */
  const normalized = {
    water:
      typeof propertyRates?.waterRate === "number"
        ? {
            rate: propertyRates.waterRate,
            total: propertyRates.waterTotal,
            consumption: propertyRates.waterConsumption,
          }
        : null,

    electricity:
      typeof propertyRates?.electricityRate === "number"
        ? {
            rate: propertyRates.electricityRate,
            total: propertyRates.electricityTotal,
            consumption: propertyRates.electricityConsumption,
          }
        : null,
  };

  const isWater = open === "water";
  const total = isWater
    ? normalized.water?.total
    : normalized.electricity?.total;
  const consumption = isWater
    ? normalized.water?.consumption
    : normalized.electricity?.consumption;
  const rate = isWater ? normalized.water?.rate : normalized.electricity?.rate;

  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
        {/* Water Rate */}
        {hasWater && normalized.water && (
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 flex-1 sm:flex-none">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Droplets className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium">Water Rate</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-blue-600">
                  ₱{normalized.water.rate.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">/ m³</span>
              </div>
            </div>
            <button
              onClick={() => setOpen("water")}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
              title="View calculation"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Electricity Rate */}
        {hasElectricity && normalized.electricity && (
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 flex-1 sm:flex-none">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium">
                Electricity Rate
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-amber-600">
                  ₱{normalized.electricity.rate.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">/ kWh</span>
              </div>
            </div>
            <button
              onClick={() => setOpen("electricity")}
              className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
              title="View calculation"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`px-5 py-4 ${
                isWater
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : "bg-gradient-to-r from-amber-500 to-yellow-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    {isWater ? (
                      <Droplets className="w-5 h-5 text-white" />
                    ) : (
                      <Zap className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {isWater ? "Water" : "Electricity"} Rate
                    </h3>
                    <p className="text-xs text-white/80">
                      Calculation Breakdown
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5">
              <div className="space-y-4">
                {/* Total Bill */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Bill</span>
                  <span className="font-semibold text-gray-900">
                    ₱
                    {Number(total || 0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Total Consumption */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    Total Consumption
                  </span>
                  <span className="font-semibold text-gray-900">
                    {Number(consumption || 0).toLocaleString()}{" "}
                    {isWater ? "m³" : "kWh"}
                  </span>
                </div>

                {/* Calculation */}
                <div
                  className={`p-4 rounded-xl ${
                    isWater
                      ? "bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200"
                      : "bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator
                      className={`w-4 h-4 ${isWater ? "text-blue-600" : "text-amber-600"}`}
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      Computation
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      ₱
                      {Number(total || 0).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ÷ {Number(consumption || 0).toLocaleString()}{" "}
                      {isWater ? "m³" : "kWh"}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        isWater ? "text-blue-600" : "text-amber-600"
                      }`}
                    >
                      = ₱{Number(rate || 0).toFixed(2)} /{" "}
                      {isWater ? "m³" : "kWh"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setOpen(null)}
                className={`w-full mt-5 px-4 py-3 rounded-xl font-semibold text-white transition-all active:scale-[0.98] ${
                  isWater
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                }`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
