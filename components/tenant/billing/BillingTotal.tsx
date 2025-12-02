"use client";

import { BanknotesIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/utils/formatter/formatters";

export default function BillingTotal({ totalDue }) {
    return (
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-emerald-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BanknotesIcon className="w-6 h-6 text-blue-600" />
                    <span className="font-bold text-gray-700">Total Amount Due</span>
                </div>

                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          {formatCurrency(totalDue)}
        </span>
            </div>
        </div>
    );
}
