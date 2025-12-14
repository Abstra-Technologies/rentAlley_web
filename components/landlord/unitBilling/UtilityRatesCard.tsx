"use client";

import { Droplets, Zap } from "lucide-react";

export default function UtilityRatesCard({ property, propertyRates }: any) {
    if (!property) return null;

    const hasWater = property?.water_billing_type === "submetered";
    const hasElectricity = property?.electricity_billing_type === "submetered";

    if (!hasWater && !hasElectricity) return null;

    return (
        <div className="flex flex-col gap-2 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 uppercase tracking-wide">
                Utility Rates
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
                {hasWater && (
                    <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-gray-500">Water:</span>
                        <span className="font-semibold text-gray-800">
              ₱{propertyRates?.waterRate?.toFixed(2)}
            </span>
                        <span className="text-gray-500">/ m³</span>
                    </div>
                )}

                {hasElectricity && (
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-gray-500">Electricity:</span>
                        <span className="font-semibold text-gray-800">
              ₱{propertyRates?.electricityRate?.toFixed(2)}
            </span>
                        <span className="text-gray-500">/ kWh</span>
                    </div>
                )}
            </div>
        </div>
    );
}
