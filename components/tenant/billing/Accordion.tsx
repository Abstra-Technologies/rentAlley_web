"use client";

import { formatCurrency } from "@/utils/formatter/formatters";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export default function Accordion({ title, open, amount, onToggle, children }) {
    return (
        <div className="space-y-2">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-xl"
            >
                <span className="font-bold">{title}</span>

                <div className="flex items-center gap-3">
                    <span className="font-bold">{formatCurrency(amount)}</span>
                    {open ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                </div>
            </button>

            {open && <div className="border rounded-xl divide-y">{children}</div>}
        </div>
    );
}
