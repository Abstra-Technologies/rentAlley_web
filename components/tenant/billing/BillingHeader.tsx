"use client";

import { CalendarIcon, ClockIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline";

export default function BillingHeader({ bill, dueDate }) {
    return (
        <div className="p-4 border-b bg-gray-50 rounded-t-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Billing ID */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ReceiptPercentIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-500 font-bold uppercase">
              Billing ID
            </span>
                    </div>
                    <p className="font-semibold">#{bill.billing_id}</p>
                </div>

                {/* Due Date */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs text-gray-500 font-bold uppercase">
              Due Date
            </span>
                    </div>
                    <p className="font-semibold">{dueDate ?? "N/A"}</p>
                </div>

                {/* Status */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ClockIcon className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-gray-500 font-bold uppercase">
              Status
            </span>
                    </div>

                    <span
                        className={`px-3 py-1 text-xs font-bold rounded-lg ${
                            bill.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                    >
            {bill.status?.toUpperCase() || "UNPAID"}
          </span>
                </div>
            </div>
        </div>
    );
}
