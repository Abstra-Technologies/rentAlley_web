"use client";

import { BackButton } from "@/components/navigation/backButton";
import UtilityRatesCard from "@/components/landlord/unitBilling/UtilityRatesCard";
import PDCCard from "@/components/landlord/unitBilling/PDCCard";
import { useCreateSubmeteredUnitBill } from "@/hooks/landlord/billing/useCreateSubmeteredUnitBill";
import {
  ReceiptText,
  Calendar,
  Home,
  Zap,
  Droplets,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function CreateUnitBill() {
  const {
    unit,
    property,
    propertyRates,
    form,
    setForm,
    extraExpenses,
    discounts,
    bill,
    pdc,
    loadingPdc,
    hasExistingBilling,

    handleChange,
    handleAddExpense,
    handleExpenseChange,
    handleRemoveExpense,
    handleAddDiscount,
    handleDiscountChange,
    handleRemoveDiscount,
    handleSubmit,
    handleMarkCleared,
  } = useCreateSubmeteredUnitBill();

  // ============================================
  // SKELETON LOADING STATE
  // ============================================
  if (!unit || !property) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
        <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header Skeleton */}
            <div className="border-b border-gray-200 p-5 md:p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-4" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-7 bg-gray-200 rounded w-64 animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Billing Period Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-200 p-5 md:p-6 bg-gray-50">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse mb-2" />
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>

            {/* Base Rent Skeleton */}
            <div className="p-5 md:p-6 border-b border-gray-200 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-3" />

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-b-0"
                  >
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                ))}
              </div>

              {/* PDC Card Skeleton */}
              <div className="border border-gray-200 rounded-xl p-4 bg-blue-50">
                <div className="h-5 bg-gray-200 rounded w-48 animate-pulse mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Utility Rates Skeleton */}
            <div className="p-5 md:p-6 border-b border-gray-200">
              <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-emerald-50"
                  >
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meter Readings Skeleton */}
            <div className="p-5 md:p-6 border-b border-gray-200">
              <div className="h-5 bg-gray-200 rounded w-48 animate-pulse mb-3" />

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-3 bg-gray-200 rounded animate-pulse"
                      />
                    ))}
                  </div>
                </div>

                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjustments Skeleton */}
            <div className="p-5 md:p-6 border-b border-gray-200 space-y-6">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="flex justify-between mb-3">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Skeleton */}
            <div className="p-5 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-4" />

              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                ))}

                <div className="border-t-2 border-gray-300 pt-4 mt-4 flex justify-between items-center">
                  <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Action Button Skeleton */}
            <div className="p-5 md:p-6 border-t border-gray-200 flex justify-end">
              <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
          {/* ================= HEADER ================= */}
          <div className="border-b border-gray-200 p-5 md:p-6 space-y-3">
            <BackButton
              label="Back to Units"
              fallback={`/pages/landlord/property-listing/view-unit/${property.property_id}`}
            />

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <ReceiptText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Billing Statement
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  {property.property_name} — Unit {unit.unit_name}
                </p>
              </div>
            </div>
          </div>

          {/* ================= BILLING PERIOD ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-200 p-5 md:p-6 bg-gray-50">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                <Calendar className="w-3.5 h-3.5" />
                Billing Period
              </label>
              <div className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg">
                <p className="font-semibold text-sm text-gray-900">
                  {new Date(form.readingDate).toLocaleString("en-PH", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                <Calendar className="w-3.5 h-3.5" />
                Billing Date
              </label>
              <input
                type="date"
                name="readingDate"
                value={form.readingDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                readOnly
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* ================= BASE RENT ================= */}
          <div className="p-5 md:p-6 border-b border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Base Rent</h2>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      Monthly Rent
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ₱{bill.rent.toFixed(2)}
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      Association Dues
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ₱{bill.dues.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ✅ PDC COMPONENT */}
            <PDCCard
              pdc={pdc}
              loadingPdc={loadingPdc}
              handleMarkCleared={handleMarkCleared}
            />
          </div>

          {/* ================= UTILITY RATES ================= */}
          <div className="p-5 md:p-6 border-b border-gray-200">
            <UtilityRatesCard
              property={property}
              propertyRates={propertyRates}
            />
          </div>

          {/* ================= METER READINGS ================= */}
          <div className="p-5 md:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Utility Meter Readings
              </h2>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Utility
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Previous
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {property.water_billing_type === "submetered" && (
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              Water
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="w-full text-right border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={form.waterPrevReading}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                waterPrevReading: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="w-full text-right border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={form.waterCurrentReading}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                waterCurrentReading: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                          {bill.waterUsage} m³
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-blue-600">
                          ₱{bill.waterCost.toFixed(2)}
                        </td>
                      </tr>
                    )}

                    {property.electricity_billing_type === "submetered" && (
                      <tr className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-gray-900">
                              Electricity
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="w-full text-right border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={form.electricityPrevReading}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                electricityPrevReading: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="w-full text-right border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={form.electricityCurrentReading}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                electricityCurrentReading: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                          {bill.elecUsage} kWh
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-emerald-600">
                          ₱{bill.elecCost.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ================= ADJUSTMENTS ================= */}
          <div className="p-5 md:p-6 border-b border-gray-200 space-y-6">
            {/* Additional Charges */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Additional Charges
                </h3>
                <button
                  onClick={handleAddExpense}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {extraExpenses.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {extraExpenses.map((exp, idx) => (
                        <tr
                          key={idx}
                          className="bg-white hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-2 w-2/3">
                            <input
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="Description"
                              value={exp.type}
                              onChange={(e) =>
                                handleExpenseChange(idx, "type", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="0.00"
                              value={exp.amount}
                              onChange={(e) =>
                                handleExpenseChange(
                                  idx,
                                  "amount",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-center w-12">
                            <button
                              onClick={() => handleRemoveExpense(idx, exp)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-500">No additional charges</p>
                </div>
              )}
            </div>

            {/* Discounts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">Discounts</h3>
                <button
                  onClick={handleAddDiscount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {discounts.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {discounts.map((disc, idx) => (
                        <tr
                          key={idx}
                          className="bg-white hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-2 w-2/3">
                            <input
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                              placeholder="Description"
                              value={disc.type}
                              onChange={(e) =>
                                handleDiscountChange(
                                  idx,
                                  "type",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                              placeholder="0.00"
                              value={disc.amount}
                              onChange={(e) =>
                                handleDiscountChange(
                                  idx,
                                  "amount",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-center w-12">
                            <button
                              onClick={() => handleRemoveDiscount(idx, disc)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-500">No discounts applied</p>
                </div>
              )}
            </div>
          </div>

          {/* ================= TOTAL ================= */}
          <div className="p-5 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Billing Summary
              </h3>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="space-y-3 text-sm">
                {/* Rent */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Rent</span>
                  <span className="font-semibold text-gray-900">
                    ₱{bill.rent.toFixed(2)}
                  </span>
                </div>

                {/* Association Dues */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Association Dues</span>
                  <span className="font-semibold text-gray-900">
                    ₱{bill.dues.toFixed(2)}
                  </span>
                </div>

                {/* Water */}
                {property.water_billing_type === "submetered" && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      Water ({bill.waterUsage} m³)
                    </span>
                    <span className="font-semibold text-blue-600">
                      ₱{bill.waterCost.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Electricity */}
                {property.electricity_billing_type === "submetered" && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      Electricity ({bill.elecUsage} kWh)
                    </span>
                    <span className="font-semibold text-emerald-600">
                      ₱{bill.elecCost.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Additional Charges */}
                {bill.totalExtraCharges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Additional Charges</span>
                    <span className="font-semibold text-gray-900">
                      ₱{bill.totalExtraCharges.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Discounts */}
                {bill.totalDiscounts > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="font-medium">Discounts</span>
                    <span className="font-semibold">
                      -₱{bill.totalDiscounts.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* PDC Application */}
                {bill.pdcAmount > 0 && (
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="font-medium">
                      Post-Dated Check
                      {bill.pdcCleared ? " (Applied)" : " (Pending)"}
                    </span>
                    <span className="font-semibold">
                      -₱{bill.pdcCoveredAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">
                    Total Amount Due
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    ₱{bill.adjustedTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= ACTION ================= */}
          <div className="p-5 md:p-6 flex justify-end">
            <button
              onClick={handleSubmit}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all ${
                hasExistingBilling
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              }`}
            >
              {hasExistingBilling ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Update Billing
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Billing
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
