"use client";

import { formatCurrency } from "@/utils/formatter/formatters";

// @ts-ignore
export default function MeterReadingList({ meterReadings = [], bill }) {
    /* ---------------- USE BILLING PERIOD ---------------- */
    const billingDate = bill?.billing_period
        ? new Date(bill.billing_period)
        : null;

    const filtered = meterReadings.filter((r) => {
        if (!r?.reading_date || !billingDate) return false;

        const readingDate = new Date(r.reading_date);

        return (
            readingDate.getMonth() === billingDate.getMonth() &&
            readingDate.getFullYear() === billingDate.getFullYear()
        );
    });

    if (!filtered.length)
        return (
            <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                    No meter readings for this billing period.
                </p>
            </div>
        );

    return (
        <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-bold mb-3">
                Meter Readings
            </p>

            <div className="space-y-3">
                {filtered.map((reading, i) => {
                    const prev = Number(reading.prev ?? 0);
                    const curr = Number(reading.curr ?? 0);

                    const usage =
                        reading.consumption != null
                            ? Number(reading.consumption)
                            : Math.max(curr - prev, 0);

                    const rate =
                        reading.type === "water"
                            ? bill.utilities?.water?.rate || 0
                            : bill.utilities?.electricity?.rate || 0;

                    const total =
                        reading.total != null
                            ? Number(reading.total)
                            : usage * rate;

                    return (
                        <div
                            key={`${reading.type}-${i}`}
                            className="bg-white p-3 border rounded-xl"
                        >
                            <div className="flex justify-between mb-2">
                                <span className="capitalize font-semibold">
                                    {reading.type}
                                </span>
                                <span className="font-bold">
                                    {formatCurrency(total)}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600">
                                Previous {prev} → Current {curr}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                                {usage} × ₱{rate}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
