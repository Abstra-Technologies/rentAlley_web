
"use client";

import { BuildingOffice2Icon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

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
                                           }: PropertyRatesModalProps)
{
    const [showInfo, setShowInfo] = useState(false);

    if (!isOpen) return null;

    return (
        <>
            {/* Main Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-white p-5 border-b border-gray-200 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-sm">
                                <BuildingOffice2Icon className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Property Utility Rates</h2>
                            <button
                                onClick={() => setShowInfo(true)}
                                className="ml-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                title="View rules"
                            >
                                <InformationCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-5 space-y-6">

                        {/* Current Billing Status */}

                        {billingData ? (
                            <div className="p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                                <h3 className="font-bold text-green-800 mb-2">Current Billing Period</h3>
                                <p className="text-gray-700 mb-4 font-medium">
                                    Period: <span className="text-green-800">{billingData.billing_period}</span>
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {propertyDetails?.electricity_billing_type === "submetered" &&
                                        billingData.electricity && (
                                            <div className="p-4 bg-white rounded-lg border border-yellow-200">
                                                <h4 className="text-sm font-bold text-gray-600 mb-1">⚡ Electricity</h4>
                                                <p className="text-2xl font-extrabold text-gray-900">
                                                    {billingData.electricity.consumption ?? "N/A"}{" "}
                                                    <span className="text-sm font-medium text-gray-500">kWh</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Total: ₱{billingData.electricity.total ?? "N/A"}
                                                </p>
                                            </div>
                                        )}

                                    {propertyDetails?.water_billing_type === "submetered" &&
                                        billingData.water && (
                                            <div className="p-4 bg-white rounded-lg border border-blue-200">
                                                <h4 className="text-sm font-bold text-gray-600 mb-1">💧 Water</h4>
                                                <p className="text-2xl font-extrabold text-gray-900">
                                                    {billingData.water.consumption ?? "N/A"}{" "}
                                                    <span className="text-sm font-medium text-gray-500">cu. m</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Total: ₱{billingData.water.total ?? "N/A"}
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 text-center rounded-lg">
                                <p className="text-gray-600">No billing data found for this month</p>
                            </div>
                        )}

                        {/* Form Section */}
                        <form className="space-y-6" onSubmit={handleSaveOrUpdateBilling}>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Billing Period
                                </label>
                                <input
                                    name="billingPeriod"
                                    value={billingForm.billingPeriod}
                                    onChange={handleInputChange}
                                    type="date"
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                                />
                            </div>

                            {/* Electricity Section */}
                            {propertyDetails?.electricity_billing_type === "submetered" && (
                                <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-orange-800 mb-4">⚡ Electricity</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                Consumption (kWh)
                                            </label>
                                            <input
                                                type="number"
                                                name="electricityConsumption"
                                                value={billingForm.electricityConsumption}
                                                onChange={handleInputChange}
                                                className="w-full border border-yellow-300 rounded-xl p-3"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                Total Amount Billed (₱)
                                            </label>
                                            <input
                                                type="number"
                                                name="electricityTotal"
                                                value={billingForm.electricityTotal}
                                                onChange={handleInputChange}
                                                className="w-full border border-yellow-300 rounded-xl p-3"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Water Section */}
                            {propertyDetails?.water_billing_type === "submetered" && (
                                <div className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-cyan-800 mb-4">💧 Water</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                Consumption (cu. m)
                                            </label>
                                            <input
                                                type="number"
                                                name="waterConsumption"
                                                value={billingForm.waterConsumption}
                                                onChange={handleInputChange}
                                                className="w-full border border-cyan-300 rounded-xl p-3"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                                Total Amount Billed (₱)
                                            </label>
                                            <input
                                                type="number"
                                                name="waterTotal"
                                                value={billingForm.waterTotal}
                                                onChange={handleInputChange}
                                                className="w-full border border-cyan-300 rounded-xl p-3"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>


                    </div>

                    {/* Modal Footer */}
                    <div className="sticky bottom-0 bg-white p-5 border-t border-gray-200 rounded-b-2xl flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium order-2 sm:order-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveOrUpdateBilling}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold order-1 sm:order-2"
                        >
                            {hasBillingForMonth ? "Update Rates" : "Save Rates"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Modal */}
            {showInfo && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-[70] bg-black bg-opacity-40 p-4"
                    onClick={() => setShowInfo(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all duration-200 scale-95 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Utility Billing Rules</h3>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
                            <li>
                                Only <span className="font-semibold">submetered utilities</span> can have manual rates
                                set.
                            </li>
                            <li>Non-submetered utilities are billed automatically by the system.</li>
                            <li>You can update rates monthly if your property is submetered.</li>
                            <li>Ensure correct billing period is selected before saving.</li>
                        </ul>
                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={() => setShowInfo(false)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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
