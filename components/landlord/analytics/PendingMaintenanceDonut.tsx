"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function MaintenanceStatusDonut({
                                                   landlordId,
                                               }: {
    landlordId: string;
}) {
    const router = useRouter();
    const fetcher = (url: string) => axios.get(url).then((res) => res.data);

    const { data, isLoading } = useSWR(
        landlordId
            ? `/api/analytics/landlord/getMaintenanceStatuses?landlord_id=${landlordId}`
            : null,
        fetcher
    );

    // STATUS LABELS
    const STATUS_LABELS: Record<string, string> = {
        Pending: "Pending",
        Approved: "Approved",
        Scheduled: "Scheduled",
        "In-Progress": "In Progress",
        Completed: "Completed",
    };

    const STATUS_COLORS: Record<string, string> = {
        Pending: "#F59E0B",
        Approved: "#3B82F6",
        Scheduled: "#06B6D4",
        "In-Progress": "#8B5CF6",
        Completed: "#10B981",
    };

    const ORDERED_STATUSES = [
        "Pending",
        "Approved",
        "Scheduled",
        "In-Progress",
        "Completed",
    ];

    if (isLoading || !data) {
        return (
            <div className="p-6 bg-white border border-gray-200 rounded-xl text-center text-gray-400 shadow">
                Loading maintenance…
            </div>
        );
    }

    const donutData = ORDERED_STATUSES.map((status) => ({
        name: STATUS_LABELS[status],
        value: Number(data[status] || 0),
    }));

    const total = donutData.reduce((n, item) => n + item.value, 0);
    const isAllZero = donutData.every((s) => s.value === 0);

    const chartData = isAllZero ? [{ name: "No Data", value: 1 }] : donutData;
    const chartColors = isAllZero
        ? ["#E5E7EB"]
        : ORDERED_STATUSES.map((status) => STATUS_COLORS[status]);

    return (
        <div
            onClick={() => router.push("/pages/landlord/maintenance-request")}
            className="
        relative group cursor-pointer
        rounded-2xl border border-gray-200 shadow
        bg-white/40 backdrop-blur-xl
        p-6 flex flex-col items-center gap-4
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
      "
        >
            {/* HOVER GRADIENT */}
            <div
                className="
          absolute inset-0 rounded-2xl
          bg-gradient-to-r from-blue-500/0 via-emerald-400/0 to-green-500/0
          group-hover:from-blue-500/10 group-hover:via-emerald-400/10 group-hover:to-green-500/10
          opacity-0 group-hover:opacity-100 transition-all duration-300
          pointer-events-none
        "
            />

            {/* HOVER CTA BUTTON */}
            <div
                className="
          absolute top-3 right-4 z-20
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          pointer-events-none
        "
            >
        <span
            className="
            bg-white/90 text-gray-800
            text-xs sm:text-sm font-medium
            px-3 py-1 rounded-full shadow-md
            backdrop-blur-md
          "
        >
          View Maintenance Requests →
        </span>
            </div>

            {/* TITLE */}
            <h2 className="text-sm font-semibold text-gray-700">
                Maintenance Status Overview
            </h2>

            <p className="text-xs text-gray-500">{total} total requests</p>

            {/* DONUT + LEGEND */}
            <div className="flex items-center gap-4">
                {/* DONUT CHART */}
                <div className="w-40 h-40 z-10">
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

                {/* LEGEND */}
                <div className="flex flex-col text-xs text-gray-700 gap-2 z-10">
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
