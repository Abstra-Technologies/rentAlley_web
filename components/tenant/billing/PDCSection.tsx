"use client";

import { CreditCardIcon } from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

export default function PDCSection({ pdcs }) {
    return (
        <div className="p-4 bg-blue-50 border-t">
            <p className="font-bold flex items-center gap-2 mb-3">
                <CreditCardIcon className="w-5 h-5 text-blue-600" />
                Post-Dated Checks
            </p>

            <div className="space-y-2">
                {pdcs.map((pdc, i) => (
                    <div key={i} className="bg-white p-3 border rounded-xl">
                        <p className="font-semibold">{pdc.bank_name}</p>
                        <p className="text-sm text-gray-600">Check #{pdc.check_number}</p>

                        <div className="flex justify-between mt-2">
                            <span className="text-gray-500">Due {formatDate(pdc.due_date)}</span>
                            <span className="font-bold">{formatCurrency(pdc.amount)}</span>
                        </div>

                        <p className="text-xs capitalize mt-1">Status: {pdc.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
