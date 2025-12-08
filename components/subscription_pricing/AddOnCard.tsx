"use client";

import { formatCurrency } from "@/utils/formatter/formatters";

export default function AddOnCard({ addon, disabled, selected, onToggle }) {
    return (
        <div
            className={`
                rounded-2xl border shadow-md p-6 cursor-pointer transition-all 
                ${disabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-1"}
                ${selected ? "ring-2 ring-blue-500 bg-blue-50" : "bg-white"}
            `}
            onClick={() => !disabled && onToggle(addon)}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{addon.name}</h3>

                {!disabled && (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggle(addon)}
                        className="h-5 w-5 accent-blue-600"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </div>

            <p className="text-gray-600 text-sm">{addon.description}</p>

            <p className="mt-4 text-lg font-semibold text-blue-600">
                {formatCurrency(addon.price)}
            </p>
        </div>
    );
}
