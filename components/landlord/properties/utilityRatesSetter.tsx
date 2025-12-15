"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Building2,
    Info,
    X,
    Zap,
    Droplet,
    HelpCircle,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatter/formatters";
import { useOnboarding } from "@/hooks/useOnboarding";
import { propertyRatesModalSteps } from "@/lib/onboarding/propertyBilling";

interface PropertyRatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    billingData: any;
    billingForm: any;
    propertyDetails: any;
    hasBillingForMonth: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSaveorUpdateRates: (e: React.FormEvent) => void;
    onBillingUpdated?: (updatedData: any) => void;
}

export default function PropertyRatesModal({
                                               isOpen,
                                               onClose,
                                               billingData,
                                               billingForm,
                                               propertyDetails,
                                               hasBillingForMonth,
                                               handleInputChange,
                                               handleSaveorUpdateRates,
                                               onBillingUpdated,
                                           }: PropertyRatesModalProps) {
    const [showInfo, setShowInfo] = useState(false);

    /* ---------------- ONBOARDING ---------------- */
    const { startTour } = useOnboarding({
        tourId: "property-rates-modal",
        steps: propertyRatesModalSteps,
        autoStart: false,
    });

    /* ---------------- RATE COMPUTATION (DISPLAY ONLY) ---------------- */
    const computedRates = useMemo(() => {
        const eTotal = Number(billingForm.electricityTotal);
        const eCons = Number(billingForm.electricityConsumption);
        const wTotal = Number(billingForm.waterTotal);
        const wCons = Number(billingForm.waterConsumption);

        return {
            electricityRate:
                eTotal > 0 && eCons > 0 ? eTotal / eCons : 0,
            waterRate:
                wTotal > 0 && wCons > 0 ? wTotal / wCons : 0,
        };
    }, [
        billingForm.electricityTotal,
        billingForm.electricityConsumption,
        billingForm.waterTotal,
        billingForm.waterConsumption,
    ]);

    const canSave =
        billingForm.periodStart &&
        billingForm.periodEnd &&
        (
            propertyDetails?.electricity_billing_type !== "submetered" ||
            (Number(billingForm.electricityTotal) > 0 &&
                Number(billingForm.electricityConsumption) > 0)
        ) &&
        (
            propertyDetails?.water_billing_type !== "submetered" ||
            (Number(billingForm.waterTotal) > 0 &&
                Number(billingForm.waterConsumption) > 0)
        );

    if (!isOpen) return null;

    return (
        <>
            {/* ================= MODAL WRAPPER ================= */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border">

                    {/* ================= HEADER ================= */}
                    <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Property Utility Rate Settings
                                    </h2>
                                    <button
                                        onClick={() => setShowInfo(true)}
                                        className="text-gray-400 hover:text-blue-600"
                                    >
                                        <Info className="h-5 w-5" />
                                    </button>
                                </div>

                                <p className="text-sm text-gray-600">
                                    Enter concessionaire totals to automatically compute utility rates.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={startTour}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Show guide"
                            >
                                <HelpCircle className="h-5 w-5" />
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* ================= CONTENT ================= */}
                    <div className="p-6 space-y-6">

                        {/* -------- Reading Period -------- */}
                        <div id="reading-period-section">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Reading Period
                            </label>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500">Start</label>
                                    <input
                                        type="date"
                                        name="periodStart"
                                        value={billingForm.periodStart || ""}
                                        onChange={handleInputChange}
                                        className="border rounded-lg p-3 text-sm w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">End</label>
                                    <input
                                        type="date"
                                        name="periodEnd"
                                        value={billingForm.periodEnd || ""}
                                        onChange={handleInputChange}
                                        className="border rounded-lg p-3 text-sm w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* -------- Electricity -------- */}
                        {propertyDetails?.electricity_billing_type === "submetered" && (
                            <div
                                id="electricity-rates-section"
                                className="border rounded-xl p-5 bg-amber-50/40"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="text-amber-600" />
                                    <h3 className="font-semibold text-gray-800">
                                        Electricity
                                    </h3>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">
                                            Consumption (kWh)
                                        </label>
                                        <input
                                            type="number"
                                            name="electricityConsumption"
                                            value={billingForm.electricityConsumption}
                                            onChange={handleInputChange}
                                            className="border rounded-lg p-3 w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Total Amount (₱)
                                        </label>
                                        <input
                                            type="number"
                                            name="electricityTotal"
                                            value={billingForm.electricityTotal}
                                            onChange={handleInputChange}
                                            className="border rounded-lg p-3 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-white border rounded-lg">
                                    <label className="text-xs text-gray-500">
                                        Computed Rate (auto)
                                    </label>
                                    <p className="text-lg font-bold text-amber-700">
                                        {formatCurrency(computedRates.electricityRate)} / kWh
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Formula: total ÷ consumption
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* -------- Water -------- */}
                        {propertyDetails?.water_billing_type === "submetered" && (
                            <div
                                id="water-rates-section"
                                className="border rounded-xl p-5 bg-blue-50/40"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Droplet className="text-blue-600" />
                                    <h3 className="font-semibold text-gray-800">
                                        Water
                                    </h3>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">
                                            Consumption (m³)
                                        </label>
                                        <input
                                            type="number"
                                            name="waterConsumption"
                                            value={billingForm.waterConsumption}
                                            onChange={handleInputChange}
                                            className="border rounded-lg p-3 w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Total Amount (₱)
                                        </label>
                                        <input
                                            type="number"
                                            name="waterTotal"
                                            value={billingForm.waterTotal}
                                            onChange={handleInputChange}
                                            className="border rounded-lg p-3 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-white border rounded-lg">
                                    <label className="text-xs text-gray-500">
                                        Computed Rate (auto)
                                    </label>
                                    <p className="text-lg font-bold text-blue-700">
                                        {formatCurrency(computedRates.waterRate)} / m³
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Formula: total ÷ consumption
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ================= FOOTER ================= */}
                    <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            disabled={!canSave}
                            onClick={(e) => {
                                handleSaveorUpdateRates(e);
                                onBillingUpdated?.({
                                    period_start: billingForm.periodStart,
                                    period_end: billingForm.periodEnd,
                                    electricity: {
                                        consumption: Number(billingForm.electricityConsumption) || 0,
                                        total: Number(billingForm.electricityTotal) || 0,
                                    },
                                    water: {
                                        consumption: Number(billingForm.waterConsumption) || 0,
                                        total: Number(billingForm.waterTotal) || 0,
                                    },
                                });
                            }}
                            className={`px-6 py-2.5 rounded-lg text-white ${
                                canSave
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {hasBillingForMonth ? "Update Rates" : "Save Rates"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= INFO MODAL ================= */}
            {showInfo && (
                <div
                    className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setShowInfo(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">
                                Utility Rate Rules
                            </h3>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                            <li>Rates are computed from concessionaire totals.</li>
                            <li>Formula: total amount ÷ total consumption.</li>
                            <li>Rates apply to all submetered units for this period.</li>
                            <li>Once used, rates should not be changed retroactively.</li>
                        </ul>

                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setShowInfo(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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
