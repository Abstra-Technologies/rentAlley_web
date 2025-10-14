"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    Cog6ToothIcon,
    BellAlertIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
    BeakerIcon,
} from "@heroicons/react/24/outline";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";

interface PropertyConfigurationProps {
    propertyId: number;
}

export default function PropertyConfiguration({ propertyId }: PropertyConfigurationProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [configForm, setConfigForm] = useState({
        billingReminderDay: 1,
        billingDueDay: 1,
        notifyEmail: false,
        notifySms: false,
        lateFeeType: "fixed",
        lateFeeAmount: 0,
        gracePeriodDays: 3,
        water_billing_type: "included",
        elec_billing_type: "included",
    });

    // 🔹 Fetch property + config
    useEffect(() => {
        if (!propertyId) return;
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`/api/properties/configuration?id=${propertyId}`);
                if (res.data) {
                    setConfigForm({
                        billingReminderDay: res.data.billingReminderDay || 1,
                        billingDueDay: res.data.billingDueDay || 1,
                        notifyEmail: !!res.data.notifyEmail,
                        notifySms: !!res.data.notifySms,
                        lateFeeType: res.data.lateFeeType || "fixed",
                        lateFeeAmount: res.data.lateFeeAmount || 0,
                        gracePeriodDays: res.data.gracePeriodDays || 3,
                        water_billing_type: res.data.water_billing_type || "included",
                        elec_billing_type: res.data.elec_billing_type || "included",
                    });
                }
                console.log('proerty congfig', res.data);
            } catch (err) {
                console.error("Failed to fetch property config:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [propertyId]);

    // 🔹 Handle field changes with alert for billing type
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target;

        if (name === "water_billing_type" || name === "elec_billing_type") {
            const confirm = await Swal.fire({
                icon: "warning",
                title: "Changing Billing Type",
                text: `Changing the ${name === "water_billing_type" ? "Water" : "Electricity"} billing type may affect how tenant billings are generated. Do you want to continue?`,
                showCancelButton: true,
                confirmButtonText: "Yes, change it",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#2563eb",
                cancelButtonColor: "#9ca3af",
            });

            if (!confirm.isConfirmed) return;
        }

        setConfigForm((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : ["lateFeeAmount", "gracePeriodDays"].includes(name)
                        ? Number(value)
                        : value,
        }));
    };

    // 🔹 Handle save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post("/api/properties/configuration", {
                property_id: propertyId,
                ...configForm,
            });
            Swal.fire("Saved!", "Property configuration updated successfully.", "success");
        } catch (err) {
            console.error("Failed to save config:", err);
            Swal.fire("Error", "Could not save configuration", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="text-gray-500">Loading configuration...</p>;

    return (
        <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl shadow-md">
                    <Cog6ToothIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Property Configuration</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Section 1: Notifications */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <BellAlertIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            Property Notifications
                        </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reminder Day of Month
                            </label>
                            <select
                                name="billingReminderDay"
                                value={configForm.billingReminderDay}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2.5"
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                        {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Billing Due Date (Day of Month)
                            </label>
                            <select
                                name="billingDueDay"
                                value={configForm.billingDueDay}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2.5"
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                        {day === 1
                                            ? "st"
                                            : day === 2
                                                ? "nd"
                                                : day === 3
                                                    ? "rd"
                                                    : "th"}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Rent billings will be due every <b>{configForm.billingDueDay}</b>
                                {configForm.billingDueDay === 1 ? "st" : "th"} of the month.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notification Channels
                            </label>
                            <div className="flex gap-6 mt-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="notifyEmail"
                                        checked={configForm.notifyEmail}
                                        onChange={handleChange}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Email</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="notifySms"
                                        checked={configForm.notifySms}
                                        onChange={handleChange}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">SMS</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Utility Billing */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <BeakerIcon className="h-5 w-5 text-sky-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Utility Billing</h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Water Billing Type
                            </label>
                            <select
                                name="water_billing_type"
                                value={configForm.water_billing_type}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm p-2.5"
                            >
                                {UTILITY_BILLING_TYPES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Electricity Billing Type
                            </label>
                            <select
                                name="elec_billing_type"
                                value={configForm.elec_billing_type}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm p-2.5"
                            >
                                {UTILITY_BILLING_TYPES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        ⚠️ Changing these settings affects how future tenant billings are generated for this property.
                    </p>
                </div>

                {/* Section 3: Late Payment Configuration */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <CurrencyDollarIcon className="h-5 w-5 text-rose-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            Late Payment Penalty
                        </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Penalty Type
                            </label>
                            <select
                                name="lateFeeType"
                                value={configForm.lateFeeType}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-rose-500 focus:border-rose-500 text-sm p-2.5"
                            >
                                <option value="fixed">Fixed Amount (₱ per day)</option>
                                <option value="percentage">Percentage (% per day)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {configForm.lateFeeType === "fixed"
                                    ? "Penalty Amount (₱ per day)"
                                    : "Penalty Rate (% per day)"}
                            </label>
                            <input
                                type="number"
                                name="lateFeeAmount"
                                min="0"
                                step="0.01"
                                value={configForm.lateFeeAmount}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-rose-500 focus:border-rose-500 text-sm p-2.5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Grace Period (Days)
                            </label>
                            <input
                                type="number"
                                name="gracePeriodDays"
                                min="0"
                                value={configForm.gracePeriodDays}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-rose-500 focus:border-rose-500 text-sm p-2.5"
                            />
                        </div>

                        <div className="flex items-center">
                            <p className="text-xs text-gray-500">
                                Penalties apply <b>per day of delay</b> after grace period. Example: ₱200/day or 5%/day.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-2.5 font-semibold rounded-lg shadow-md transition-all duration-200 active:scale-95
                            ${
                            submitting
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg hover:from-blue-700 hover:to-emerald-700"
                        }`}
                    >
                        {submitting ? "Submitting..." : "Save Configuration"}
                    </button>
                </div>
            </form>
        </div>
    );
}
