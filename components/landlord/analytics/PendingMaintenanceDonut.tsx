"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import axios from "axios";

export default function MaintenanceStatusDonut({ landlordId }: { landlordId: string }) {
    const fetcher = (url: string) => axios.get(url).then((res) => res.data);

    const { data, isLoading } = useSWR(
        landlordId
            ? `/api/analytics/landlord/getMaintenanceStatuses?landlord_id=${landlordId}`
            : null,
        fetcher
    );

    if (isLoading || !data) {
        return (
            <div className="w-full flex flex-col items-center py-6 text-gray-400">
                Loading maintenance…
            </div>
        );
    }

    // 🔵 MAPPING → Backend key → UI Display Name
    const STATUS_LABELS: Record<string, string> = {
        "Pending": "Pending",
        "Approved": "Approved",
        "Scheduled": "Scheduled",
        "In-Progress": "In Progress",
        "Completed": "Completed",
    };

    // 🟢 FIXED ORDER for consistent display
    const ORDERED_STATUSES = [
        "Pending",
        "Approved",
        "Scheduled",
        "In-Progress",
        "Completed",
    ];

    // 🎯 Build donutData in the correct order
    const donutData = ORDERED_STATUSES.map((status) => ({
        name: STATUS_LABELS[status],
        value: Number(data[status] || 0),
    }));

    const total = donutData.reduce((sum, item) => sum + item.value, 0);

    // 🌟 FIX: Handle ALL-ZERO case (Recharts breaks otherwise)
    const isAllZero = donutData.every((s) => s.value === 0);

    const chartData = isAllZero
        ? [{ name: "No Data", value: 1 }]
        : donutData;

    const chartColors = isAllZero
        ? ["#E5E7EB"] // gray placeholder
        : donutData.map((_, idx) => {
            const status = ORDERED_STATUSES[idx];
            return STATUS_COLORS[status];
        });

    // 🎨 Fixed color mapping
    const STATUS_COLORS: Record<string, string> = {
        "Pending": "#F59E0B",
        "Approved": "#3B82F6",
        "Scheduled": "#06B6D4",
        "In-Progress": "#8B5CF6",
        "Completed": "#10B981",
    };

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Maintenance Status Overview
            </h2>
            <p className="text-xs text-gray-500 mb-3">{total} total requests</p>

            <div className="flex items-center gap-4">
                {/* Donut Chart */}
                <div className="w-40 h-40">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                innerRadius="60%"
                                outerRadius="85%"
                                paddingAngle={2}
                                stroke="none"
                            >
                                {chartData.map((_, idx) => (
                                    <Cell key={idx} fill={chartColors[idx]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-col text-xs text-gray-700 gap-2">
                    {!isAllZero ? (
                        donutData.map((item, idx) => {
                            const rawKey = ORDERED_STATUSES[idx];
                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-sm"
                                        style={{ backgroundColor: STATUS_COLORS[rawKey] }}
                                    ></span>
                                    {item.name} ({item.value})
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-gray-400 text-xs italic">
                            No maintenance requests yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
