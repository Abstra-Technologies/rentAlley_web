
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

interface PropertyConfigurationProps {
    propertyId: string;
}

const PropertyConfiguration: React.FC<PropertyConfigurationProps> = ({ propertyId }) => {
    const [loading, setLoading] = useState(true);
    const [configForm, setConfigForm] = useState({
        billingReminderDay: 1,
        notifyEmail: false,
        notifySms: false,
    });

    // Fetch existing config
    useEffect(() => {
        if (!propertyId) return;

        const fetchConfig = async () => {
            try {
                const res = await axios.get(`/api/properties/configuration?id=${propertyId}`);
                if (res.data) {
                    setConfigForm({
                        billingReminderDay: res.data.billingReminderDay || 1,
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

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target;
        setConfigForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : Number(value),
        }));
    };

    // Save config
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("/api/properties/configuration", {
                property_id: propertyId,
                ...configForm,
            });
            Swal.fire("Saved!", "Configuration updated successfully", "success");
        } catch (err) {
            console.error("Failed to save config:", err);
            Swal.fire("Error", "Could not save configuration", "error");
        }
    };

    if (loading) {
        return <p className="text-gray-500">Loading configuration...</p>;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-2 rounded-lg shadow-sm">
                    <Cog6ToothIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Property Configuration</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Billing Reminder Day of Month */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Billing Setup Reminder
                    </label>
                    <select
                        name="billingReminderDay"
                        value={configForm.billingReminderDay}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day}>
                                {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Example: If you select 5, reminders will be sent every 5th of the month.
                    </p>
                </div>

                {/* Notification Channels */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Notification Channels
                    </label>
                    <div className="mt-2 flex gap-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="notifyEmail"
                                checked={configForm.notifyEmail}
                                onChange={handleChange}
                                className="rounded text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">Email</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="notifySms"
                                checked={configForm.notifySms}
                                onChange={handleChange}
                                className="rounded text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">SMS</span>
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800"
                >
                    Save Configuration
                </button>
            </form>
        </div>
    );
};

export default PropertyConfiguration;
