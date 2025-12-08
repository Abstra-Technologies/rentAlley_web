"use client";

import AddOnCard from "./AddOnCard";
import { ADD_ON_SERVICES } from "@/constant/subscription/addOns";

export default function AddOnServices({ selectedAddOns, onChange, hasSelectedPlan }) {

    const toggleAddOn = (addon) => {
        if (!hasSelectedPlan) return;

        const exists = selectedAddOns.some(a => a.id === addon.id);

        const updated = exists
            ? selectedAddOns.filter(a => a.id !== addon.id)
            : [...selectedAddOns, addon];

        onChange(updated);
    };

    return (
        <div className="mt-16">
            <h2 className="text-2xl font-bold mb-4">Optional Add-On Services</h2>

            {!hasSelectedPlan && (
                <p className="text-red-500 mb-4 font-medium">
                    Please select a subscription plan first to unlock add-ons.
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ADD_ON_SERVICES.map((addon) => (
                    <AddOnCard
                        key={addon.id}
                        addon={addon}
                        disabled={!hasSelectedPlan}
                        selected={selectedAddOns.some(a => a.id === addon.id)}
                        onToggle={toggleAddOn}
                    />
                ))}
            </div>

            {hasSelectedPlan && selectedAddOns.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-700">Selected Add-Ons</h4>
                    <ul className="list-disc pl-5 mt-2 text-sm text-blue-800">
                        {selectedAddOns.map(a => (
                            <li key={a.id}>{a.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
