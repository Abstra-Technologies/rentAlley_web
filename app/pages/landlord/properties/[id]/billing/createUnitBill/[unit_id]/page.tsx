"use client";

import { BackButton } from "@/components/navigation/backButton";
import UtilityRatesCard from "@/components/landlord/unitBilling/UtilityRatesCard";
import PDCCard from "@/components/landlord/unitBilling/PDCCard";
import { useCreateSubmeteredUnitBill } from "@/hooks/landlord/billing/useCreateSubmeteredUnitBill";

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

    if (!unit || !property) {
        return <div className="text-center mt-10 text-gray-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border">

                {/* ================= HEADER ================= */}
                <div className="border-b p-5 space-y-2">
                    <BackButton
                        label="Back to Units"
                        fallback={`/pages/landlord/property-listing/view-unit/${property.property_id}`}
                    />

                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Billing Statement
                        </h1>
                        <p className="text-sm text-gray-500">
                            {property.property_name} — Unit {unit.unit_name}
                        </p>
                    </div>
                </div>

                {/* ================= BILLING PERIOD ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b p-5 text-sm bg-gray-50">
                    <div>
                        <p className="text-gray-500">Billing Period</p>
                        <p className="font-semibold">
                            {new Date(form.readingDate).toLocaleString("en-PH", {
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-500">Billing Date</p>
                        <input
                            type="date"
                            name="readingDate"
                            value={form.readingDate}
                            onChange={handleChange}
                            className="w-full border rounded-md px-2 py-1 bg-white"
                        />
                    </div>

                    <div>
                        <p className="text-gray-500">Due Date</p>
                        <input
                            type="date"
                            value={form.dueDate}
                            readOnly
                            className="w-full border rounded-md px-2 py-1 bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* ================= BASE RENT ================= */}
                <div className="p-5 border-b space-y-4">
                    <h2 className="font-semibold text-gray-700">
                        Base Rent
                    </h2>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <tbody className="divide-y bg-white">
                            <tr>
                                <td className="px-4 py-3 text-gray-600">
                                    Monthly Rent
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                    ₱{bill.rent.toFixed(2)}
                                </td>
                            </tr>

                            <tr>
                                <td className="px-4 py-3 text-gray-600">
                                    Association Dues
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                    ₱{bill.dues.toFixed(2)}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ✅ PDC COMPONENT (INSERTED HERE) */}
                    <PDCCard
                        pdc={pdc}
                        loadingPdc={loadingPdc}
                        handleMarkCleared={handleMarkCleared}
                    />
                </div>

                {/* ================= UTILITY RATES ================= */}
                <div className="p-5 border-b">
                    <UtilityRatesCard
                        property={property}
                        propertyRates={propertyRates}
                    />
                </div>

                {/* ================= METER READINGS ================= */}
                <div className="p-5">
                    <h2 className="font-semibold text-gray-700 mb-3">
                        Utility Meter Readings
                    </h2>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm min-w-[520px]">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">Utility</th>
                                <th className="px-4 py-2 text-right">Previous</th>
                                <th className="px-4 py-2 text-right">Current</th>
                                <th className="px-4 py-2 text-right">Usage</th>
                                <th className="px-4 py-2 text-right">Cost</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y">

                            {property.water_billing_type === "submetered" && (
                                <tr>
                                    <td className="px-4 py-3">💧 Water</td>
                                    <td className="px-4 py-2">
                                        <input
                                            className="w-full text-right border rounded px-2 py-1"
                                            value={form.waterPrevReading}
                                            onChange={(e) =>
                                                setForm(p => ({
                                                    ...p,
                                                    waterPrevReading: e.target.value,
                                                }))
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            className="w-full text-right border rounded px-2 py-1"
                                            value={form.waterCurrentReading}
                                            onChange={(e) =>
                                                setForm(p => ({
                                                    ...p,
                                                    waterCurrentReading: e.target.value,
                                                }))
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {bill.waterUsage}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        ₱{bill.waterCost.toFixed(2)}
                                    </td>
                                </tr>
                            )}

                            {property.electricity_billing_type === "submetered" && (
                                <tr>
                                    <td className="px-4 py-3">⚡ Electricity</td>
                                    <td className="px-4 py-2">
                                        <input
                                            className="w-full text-right border rounded px-2 py-1"
                                            value={form.electricityPrevReading}
                                            onChange={(e) =>
                                                setForm(p => ({
                                                    ...p,
                                                    electricityPrevReading: e.target.value,
                                                }))
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            className="w-full text-right border rounded px-2 py-1"
                                            value={form.electricityCurrentReading}
                                            onChange={(e) =>
                                                setForm(p => ({
                                                    ...p,
                                                    electricityCurrentReading: e.target.value,
                                                }))
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {bill.elecUsage}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        ₱{bill.elecCost.toFixed(2)}
                                    </td>
                                </tr>
                            )}

                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ================= ADJUSTMENTS ================= */}
                <div className="p-5 border-t space-y-8">
                    {/* Additional Charges */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-gray-700">
                                Additional Charges
                            </h3>
                            <button
                                onClick={handleAddExpense}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                + Add
                            </button>
                        </div>

                        <table className="w-full text-sm border rounded-lg">
                            <tbody className="divide-y">
                            {extraExpenses.map((exp, idx) => (
                                <tr key={idx}>
                                    <td className="px-3 py-2">
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            value={exp.type}
                                            onChange={(e) =>
                                                handleExpenseChange(idx, "type", e.target.value)
                                            }
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            className="w-full border rounded px-2 py-1 text-right"
                                            value={exp.amount}
                                            onChange={(e) =>
                                                handleExpenseChange(idx, "amount", e.target.value)
                                            }
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            onClick={() => handleRemoveExpense(idx, exp)}
                                            className="text-red-600"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Discounts */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-gray-700">
                                Discounts
                            </h3>
                            <button
                                onClick={handleAddDiscount}
                                className="text-sm text-green-600 hover:underline"
                            >
                                + Add
                            </button>
                        </div>

                        <table className="w-full text-sm border rounded-lg">
                            <tbody className="divide-y">
                            {discounts.map((disc, idx) => (
                                <tr key={idx}>
                                    <td className="px-3 py-2">
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            value={disc.type}
                                            onChange={(e) =>
                                                handleDiscountChange(idx, "type", e.target.value)
                                            }
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            className="w-full border rounded px-2 py-1 text-right"
                                            value={disc.amount}
                                            onChange={(e) =>
                                                handleDiscountChange(idx, "amount", e.target.value)
                                            }
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            onClick={() => handleRemoveDiscount(idx, disc)}
                                            className="text-red-600"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ================= TOTAL ================= */}
                {/* ================= TOTAL ================= */}
                <div className="p-5 border-t bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        Billing Summary
                    </h3>

                    <div className="space-y-2 text-sm">
                        {/* Rent */}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Rent</span>
                            <span>₱{bill.rent.toFixed(2)}</span>
                        </div>

                        {/* Association Dues */}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Association Dues</span>
                            <span>₱{bill.dues.toFixed(2)}</span>
                        </div>

                        {/* Water */}
                        {property.water_billing_type === "submetered" && (
                            <div className="flex justify-between">
                <span className="text-gray-600">
                    Water ({bill.waterUsage} m³)
                </span>
                                <span>₱{bill.waterCost.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Electricity */}
                        {property.electricity_billing_type === "submetered" && (
                            <div className="flex justify-between">
                <span className="text-gray-600">
                    Electricity ({bill.elecUsage} kWh)
                </span>
                                <span>₱{bill.elecCost.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Additional Charges */}
                        {bill.totalExtraCharges > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Additional Charges</span>
                                <span>₱{bill.totalExtraCharges.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Discounts */}
                        {bill.totalDiscounts > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Discounts</span>
                                <span>-₱{bill.totalDiscounts.toFixed(2)}</span>
                            </div>
                        )}

                        {/* PDC Application */}
                        {bill.pdcAmount > 0 && (
                            <div className="flex justify-between text-blue-600">
                <span>
                    Post-Dated Check
                    {bill.pdcCleared ? " (Applied)" : " (Pending)"}
                </span>
                                <span>
                    -₱{bill.pdcCoveredAmount.toFixed(2)}
                </span>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="border-t pt-3 mt-3 flex justify-between items-center">
            <span className="text-base font-semibold text-gray-800">
                Total Amount Due
            </span>
                            <span className="text-2xl font-bold text-emerald-600">
                ₱{bill.adjustedTotal.toFixed(2)}
            </span>
                        </div>
                    </div>
                </div>


                {/* ================= ACTION ================= */}
                <div className="p-5 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        className={`px-6 py-3 rounded-lg font-semibold shadow ${
                            hasExistingBilling
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                    >
                        {hasExistingBilling ? "Update Billing" : "Submit Billing"}
                    </button>
                </div>

            </div>
        </div>
    );
}
