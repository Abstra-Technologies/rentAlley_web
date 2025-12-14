"use client";

import { Calendar, Lock } from "lucide-react";

export default function DatesForm({ form, setForm }: any) {
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="space-y-5">

            {/* ===================== BILLING + DUE DATE ===================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Billing Period */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Billing Period
                    </label>

                    <input
                        type="date"
                        name="billingDate"
                        value={form.billingDate || today}
                        onChange={(e) =>
                            setForm((p: any) => ({ ...p, billingDate: e.target.value }))
                        }
                        className="
              w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
                    />

                    <p className="text-xs text-gray-500 italic mt-1 flex items-start gap-1">
                        <Calendar className="w-3 h-3 mt-0.5" />
                        Official billing date.
                    </p>
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Due Date
                    </label>

                    <div className="relative">
                        <input
                            type="date"
                            value={form.dueDate}
                            readOnly
                            className="
                w-full bg-gray-100 border border-gray-300 rounded-lg
                px-3 py-2.5 text-sm text-gray-700 cursor-not-allowed
              "
                        />
                        <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    </div>

                    <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
                        <Calendar className="w-3 h-3 mt-0.5" />
                        Based on property configuration.
                    </p>
                </div>

            </div>

            {/* ===================== UTILITY PERIOD COVERAGE ===================== */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Utility Period Coverage
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Coverage Start */}
                    <div>
                        <input
                            type="date"
                            value={form.readingPeriodStart || ""}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    readingPeriodStart: e.target.value,
                                }))
                            }
                            className="
                w-full border border-gray-300 rounded-lg
                px-3 py-2.5 text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              "
                        />
                        <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                            <Calendar className="w-3 h-3 mt-0.5" />
                            From (last meter reading)
                        </p>
                    </div>

                    {/* Coverage End */}
                    <div>
                        <input
                            type="date"
                            value={form.readingPeriodEnd || ""}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    readingPeriodEnd: e.target.value,
                                }))
                            }
                            className="
                w-full border border-gray-300 rounded-lg
                px-3 py-2.5 text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              "
                        />
                        <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                            <Calendar className="w-3 h-3 mt-0.5" />
                            To (current meter reading)
                        </p>
                    </div>

                </div>
            </div>

        </div>
    );
}
