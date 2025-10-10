"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    Cog6ToothIcon,
    BellAlertIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface PropertyConfigurationProps {
    propertyId: number;
}

export default function PropertyConfiguration({ propertyId }: PropertyConfigurationProps) {
    const [loading, setLoading] = useState(true);
    const [configForm, setConfigForm] = useState({
        billingReminderDay: 1,
        billingDueDay: 1,
        notifyEmail: false,
        notifySms: false,
    });

    useEffect(() => {
        if (!propertyId) return;
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`/api/properties/configuration?id=${propertyId}`);
                if (res.data) {
                    setConfigForm({
                        billingReminderDay: res.data.billingReminderDay || 1,
                        billingDueDay: res.data.billingDueDay || 1,
                        notifyEmail: res.data.notifyEmail || false,
                        notifySms: res.data.notifySms || false,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch property config:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [propertyId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target;
        setConfigForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : Number(value),
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("/api/properties/configuration", {
                property_id: propertyId,
                ...configForm,
            });
            Swal.fire("Saved!", "Property configuration updated successfully.", "success");
        } catch (err) {
            console.error("Failed to save config:", err);
            Swal.fire("Error", "Could not save configuration", "error");
        }
    };

    if (loading) {
        return <p className="text-gray-500">Loading configuration...</p>;
    }

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
                {/* Section 1: Landlord Notifications */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <BellAlertIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            Property Notifications
                        </h3>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Month to Send Reminder
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
                    <p className="text-xs text-gray-500 mt-2">
                        Example: If set to 5, UpKyp will remind you every 5th of the month to generate
                        or review your property’s billing.
                    </p>

                    <div className="mt-4">
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

                {/* Section 2: Tenant Billing */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDaysIcon className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            For Tenant Billing
                        </h3>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Due Date
                    </label>
                    <select
                        name="billingDueDay"
                        value={configForm.billingDueDay}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm p-2.5"
                    >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day}>
                                {day}
                                {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                        Example: If set to 10, all billings for tenants under this property will be due
                        every 10th of the month.
                    </p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 active:scale-95"
                    >
                        Save Configuration
                    </button>
                </div>
            </form>
        </div>
    );
}
