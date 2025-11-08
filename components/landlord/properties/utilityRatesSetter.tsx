"use client";

import { useState, useEffect } from "react";
import { Building2, Info, X, Calculator, Zap, Droplet } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

interface PropertyRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingData: any;
  billingForm: any;
  propertyDetails: any;
  hasBillingForMonth: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveOrUpdateBilling: (e: React.FormEvent) => void;
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
}: PropertyRatesModalProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [propertyRate, setPropertyRate] = useState({
    electricityRate: 0,
    waterRate: 0,
  });

  // Auto compute property rate (PHP per unit)
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

  // Re-render modal top section instantly when parent billingData updates
  useEffect(() => {
    if (billingData) {
      setPropertyRate({
        electricityRate:
          billingData?.electricity?.consumption > 0
            ? billingData.electricity.total /
              billingData.electricity.consumption
            : 0,
        waterRate:
          billingData?.water?.consumption > 0
            ? billingData.water.total / billingData.water.consumption
            : 0,
      });
    }
  }, [billingData]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
          {/* Header */}
          <div className="sticky top-0 bg-white p-5 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Property Utility Rates
                    </h2>
                    <button
                      onClick={() => setShowInfo(true)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="View rules"
                    >
                      <Info className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    This section allows the system to automatically compute and
                    set the water and electricity rates that will be charged to
                    your tenants based on your inputted totals and consumption.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Current Billing Info */}
            {billingData ? (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                <h3 className="font-bold text-emerald-800 mb-2 text-sm">
                  Current Billing Period
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Period:{" "}
                  <span className="font-semibold text-emerald-800">
                    {formatDate(billingData.billing_period)}
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {propertyDetails?.electricity_billing_type ===
                    "submetered" && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <h4 className="text-sm font-bold text-gray-700">
                          Electricity
                        </h4>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {billingData?.electricity?.consumption ?? 0}{" "}
                        <span className="text-sm font-medium text-gray-500">
                          kWh
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Total:{" "}
                        {formatCurrency(billingData?.electricity?.total ?? 0)}
                      </p>
                    </div>
                  )}

                  {propertyDetails?.water_billing_type === "submetered" && (
                    <div className="p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-bold text-gray-700">
                          Water
                        </h4>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {billingData?.water?.consumption ?? 0}{" "}
                        <span className="text-sm font-medium text-gray-500">
                          cu. m
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Total: {formatCurrency(billingData?.water?.total ?? 0)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 text-center rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  No billing data found for this month
                </p>
              </div>
            )}

            {/* Input Form */}
            <form className="space-y-5" onSubmit={handleSaveOrUpdateBilling}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Billing Month
                </label>
                <input
                  name="billingPeriod"
                  type="date"
                  value={
                    billingForm.billingPeriod
                      ? new Date(billingForm.billingPeriod)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition text-sm"
                />
              </div>

              {/* Electricity Section */}
              {propertyDetails?.electricity_billing_type === "submetered" && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-amber-600" />
                    <h3 className="text-base font-bold text-gray-900">
                      Electricity
                    </h3>
                    <Calculator className="h-4 w-4 text-amber-500 ml-auto" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consumption (kWh)
                      </label>
                      <input
                        type="number"
                        name="electricityConsumption"
                        value={billingForm.electricityConsumption}
                        onChange={handleInputChange}
                        className="w-full border border-amber-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        name="electricityTotal"
                        value={billingForm.electricityTotal}
                        onChange={handleInputChange}
                        className="w-full border border-amber-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <div className="p-3 bg-white rounded-lg border border-amber-300">
                        <p className="text-sm text-gray-700">
                          Property Rate:{" "}
                          <span className="font-bold text-amber-700">
                            {formatCurrency(propertyRate.electricityRate)}
                          </span>{" "}
                          <span className="text-gray-500">
                            per kWh (auto-computed)
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Water Section */}
              {propertyDetails?.water_billing_type === "submetered" && (
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Droplet className="h-5 w-5 text-cyan-600" />
                    <h3 className="text-base font-bold text-gray-900">Water</h3>
                    <Calculator className="h-4 w-4 text-cyan-500 ml-auto" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consumption (cu. m)
                      </label>
                      <input
                        type="number"
                        name="waterConsumption"
                        value={billingForm.waterConsumption}
                        onChange={handleInputChange}
                        className="w-full border border-cyan-300 rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        name="waterTotal"
                        value={billingForm.waterTotal}
                        onChange={handleInputChange}
                        className="w-full border border-cyan-300 rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <div className="p-3 bg-white rounded-lg border border-cyan-300">
                        <p className="text-sm text-gray-700">
                          Property Rate:{" "}
                          <span className="font-bold text-cyan-700">
                            {formatCurrency(propertyRate.waterRate)}
                          </span>{" "}
                          <span className="text-gray-500">
                            per cu. m (auto-computed)
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-lg">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrUpdateBilling}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
              >
                {hasBillingForMonth ? "Update Rates" : "Save Rates"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[60] bg-black/50 p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Utility Billing Rules
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
              <li>
                Only <span className="font-semibold">submetered utilities</span>{" "}
                can have manual rates.
              </li>
              <li>
                Non-submetered utilities are billed automatically by the system.
              </li>
              <li>
                Property Rate is auto-calculated based on total amount ÷
                consumption.
              </li>
              <li>You can update rates monthly for submetered properties.</li>
              <li>
                Ensure the correct billing period is selected before saving.
              </li>
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowInfo(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
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
