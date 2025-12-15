"use client";

import { useState } from "react";
import { Droplets, Zap, Info, X } from "lucide-react";

export default function UtilityRatesCard({ property, propertyRates }: any) {
    const [open, setOpen] = useState<null | "water" | "electricity">(null);

    if (!property) return null;

    const hasWater = property?.water_billing_type === "submetered";
    const hasElectricity = property?.electricity_billing_type === "submetered";

    if (!hasWater && !hasElectricity) return null;

    /* ✅ NORMALIZE FROM FLAT STATE */
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

    const rate = isWater
        ? normalized.water?.rate
        : normalized.electricity?.rate;

    return (
        <>
            <div className="flex flex-col gap-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 uppercase tracking-wide">
                    Utility Rates
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {hasWater && normalized.water && (
                        <div className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-gray-500">Water:</span>
                            <span className="font-semibold text-gray-800">
                                ₱{normalized.water.rate.toFixed(2)}
                            </span>
                            <span className="text-gray-500">/ m³</span>

                            <button
                                onClick={() => setOpen("water")}
                                className="ml-1 text-gray-400 hover:text-blue-600"
                            >
                                <Info className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {hasElectricity && normalized.electricity && (
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-gray-500">Electricity:</span>
                            <span className="font-semibold text-gray-800">
                                ₱{normalized.electricity.rate.toFixed(2)}
                            </span>
                            <span className="text-gray-500">/ kWh</span>

                            <button
                                onClick={() => setOpen("electricity")}
                                className="ml-1 text-gray-400 hover:text-amber-600"
                            >
                                <Info className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ================= MODAL ================= */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={() => setOpen(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold">
                                {isWater
                                    ? "Water Rate Calculation"
                                    : "Electricity Rate Calculation"}
                            </h3>
                            <button onClick={() => setOpen(null)}>
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="bg-gray-50 border rounded-lg p-3 text-xs space-y-2">
                            <div className="flex justify-between">
                                <span>Total Bill</span>
                                <span>₱{Number(total || 0).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Total Consumption</span>
                                <span>
                                    {Number(consumption || 0).toLocaleString()}{" "}
                                    {isWater ? "m³" : "kWh"}
                                </span>
                            </div>

                            <div className="border-t pt-2">
                                <p className="font-semibold">Computation</p>
                                <p className="text-gray-600">
                                    ₱{Number(total || 0).toFixed(2)} ÷{" "}
                                    {Number(consumption || 0).toLocaleString()}
                                </p>
                                <p className="font-semibold">
                                    = ₱{Number(rate || 0).toFixed(2)} /{" "}
                                    {isWater ? "m³" : "kWh"}
                                </p>
                            </div>
                        </div>

                        <div className="text-right mt-4">
                            <button
                                onClick={() => setOpen(null)}
                                className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white"
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
