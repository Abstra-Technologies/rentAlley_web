"use client";

import { Droplets, Zap } from "lucide-react";

export default function UtilityRatesCard({ property, propertyRates }: any) {
  if (!property) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
        Loading utility rates…
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
      <div className="text-sm text-gray-700 space-y-3">

        {property?.water_billing_type === "submetered" && (
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              Water Rate: ₱{propertyRates?.waterRate?.toFixed(2)} per m³
            </p>
            <p className="text-xs text-gray-500 italic mt-1">
              Derived from the property’s most recent water bill.
            </p>
          </div>
        )}

        {property?.electricity_billing_type === "submetered" && (
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Electricity Rate: ₱{propertyRates?.electricityRate?.toFixed(2)} per kWh
            </p>
            <p className="text-xs text-gray-500 italic mt-1">
              Computed using the electric utility’s latest total and consumption.
            </p>
          </div>
        )}

        {/* When both are not submetered */}
        {property?.water_billing_type !== "submetered" &&
          property?.electricity_billing_type !== "submetered" && (
            <p className="text-xs text-gray-600 italic">
              This property does not use submetered utilities.
            </p>
          )}
      </div>
    </div>
  );
}
