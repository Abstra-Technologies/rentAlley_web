"use client";

import { formatCurrency } from "@/utils/formatter/formatters";

export default function MeterReadingList({ meterReadings, bill }) {
    const now = new Date();

    const filtered = meterReadings.filter((r) => {
        const d = new Date(r.reading_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (!filtered.length)
        return (
            <div className="p-3 bg-gray-50">
                <p className="text-sm text-gray-500">No meter readings this month.</p>
            </div>
        );

    return (
        <div className="bg-gray-50 p-3">
            <p className="font-bold mb-3">Meter Readings (Current Month)</p>

            <div className="space-y-3">
                {filtered.map((reading, i) => {
                    const prev = Number(reading.previous_reading);
                    const curr = Number(reading.current_reading);
                    const usage = Math.max(curr - prev, 0);

                    const rate =
                        reading.utility_type === "water"
                            ? bill.utilities?.water.rate
                            : bill.utilities?.electricity.rate;

                    const total = usage * rate;

                    return (
                        <div key={i} className="bg-white p-3 border rounded-xl">
                            <div className="flex justify-between mb-2">
                <span className="capitalize font-semibold">
                  {reading.utility_type}
                </span>
                                <span className="font-bold">{formatCurrency(total)}</span>
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
