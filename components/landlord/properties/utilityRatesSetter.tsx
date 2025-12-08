"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Info,
  X,
  Calculator,
  Zap,
  Droplet,
  HelpCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
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
  handleSaveOrUpdateBilling: (e: React.FormEvent) => void;
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
  handleSaveOrUpdateBilling,
  onBillingUpdated,
}: PropertyRatesModalProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [propertyRate, setPropertyRate] = useState({
    electricityRate: 0,
    waterRate: 0,
  });

  // Initialize onboarding for the modal
  const { startTour } = useOnboarding({
    tourId: "property-rates-modal",
    steps: propertyRatesModalSteps,
    autoStart: false, // Don't auto-start for modals, only on manual trigger
  });

  /* Auto compute rate */
  useEffect(() => {
    if (
      billingForm.electricityTotal &&
      billingForm.electricityConsumption > 0
    ) {
      setPropertyRate((prev) => ({
        ...prev,
        electricityRate:
          parseFloat(billingForm.electricityTotal) /
          parseFloat(billingForm.electricityConsumption),
      }));
    }

    if (billingForm.waterTotal && billingForm.waterConsumption > 0) {
      setPropertyRate((prev) => ({
        ...prev,
        waterRate:
          parseFloat(billingForm.waterTotal) /
          parseFloat(billingForm.waterConsumption),
      }));
    }
  }, [
    billingForm.electricityTotal,
    billingForm.electricityConsumption,
    billingForm.waterTotal,
    billingForm.waterConsumption,
  ]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
          {/* Header */}
          <div className="sticky top-0 bg-white p-5 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Property Utility Rates
                    </h2>
                    <button
                      onClick={() => setShowInfo(true)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Info className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Set water and electricity totals based on reading period.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Help Button */}
                <button
                  onClick={startTour}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Show guide"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6">
            {/* Reading Period */}
            <div id="reading-period-section">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reading Period
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Start</label>
                  <input
                    type="date"
                    name="periodStart"
                    value={billingForm.periodStart || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">End</label>
                  <input
                    type="date"
                    name="periodEnd"
                    value={billingForm.periodEnd || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-3 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Electricity */}
            {propertyDetails?.electricity_billing_type === "submetered" && (
              <div
                className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                id="electricity-rates-section"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base font-bold">Electricity</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Consumption (kWh)
                    </label>
                    <input
                      type="number"
                      name="electricityConsumption"
                      value={billingForm.electricityConsumption}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Total Amount</label>
                    <input
                      type="number"
                      name="electricityTotal"
                      value={billingForm.electricityTotal}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>

                  <div className="col-span-2 p-3 bg-white border rounded-lg">
                    Rate:{" "}
                    <span className="font-bold text-amber-700">
                      {formatCurrency(propertyRate.electricityRate)}
                    </span>{" "}
                    per kWh
                  </div>
                </div>
              </div>
            )}

            {/* Water */}
            {propertyDetails?.water_billing_type === "submetered" && (
              <div
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                id="water-rates-section"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Droplet className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-bold">Water</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Consumption (cu.m)
                    </label>
                    <input
                      type="number"
                      name="waterConsumption"
                      value={billingForm.waterConsumption}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Total Amount</label>
                    <input
                      type="number"
                      name="waterTotal"
                      value={billingForm.waterTotal}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2.5"
                    />
                  </div>

                  <div className="col-span-2 p-3 bg-white border rounded-lg">
                    Rate:{" "}
                    <span className="font-bold text-blue-700">
                      {formatCurrency(propertyRate.waterRate)}
                    </span>{" "}
                    per cu.m
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white p-4 border-t flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700"
            >
              Cancel
            </button>

            <button
              onClick={(e) => {
                handleSaveOrUpdateBilling(e);
                onBillingUpdated?.({
                  period_start: billingForm.periodStart,
                  period_end: billingForm.periodEnd,
                  electricity: {
                    consumption:
                      parseFloat(billingForm.electricityConsumption) || 0,
                    total: parseFloat(billingForm.electricityTotal) || 0,
                  },
                  water: {
                    consumption: parseFloat(billingForm.waterConsumption) || 0,
                    total: parseFloat(billingForm.waterTotal) || 0,
                  },
                });
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {hasBillingForMonth ? "Update Billing" : "Save Billing"}
            </button>
          </div>
        </div>
      </div>

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
              <h3 className="font-bold text-gray-900">Utility Billing Rules</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
              <li>Use the meter reading start and end dates.</li>
              <li>Rates are computed from total ÷ consumption.</li>
              <li>Ensure reading period matches actual utility readings.</li>
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
