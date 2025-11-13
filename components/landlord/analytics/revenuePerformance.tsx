"use client";

import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LabelList,
    CartesianGrid,
    Area,
    AreaChart,
} from "recharts";
import axios from "axios";

const RevenuePerformanceChart = ({ landlordId }: { landlordId: number }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlordId) return;

        setLoading(true);
        axios
            .get(`/api/analytics/landlord/getRevenuePerformance?landlordId=${landlordId}`)
            .then((res) => {
                const formatted = res.data.map((item: any) => ({
                    month: item.month,
                    revenue: Number(item.revenue),
                }));
                setData(formatted);
            })
            .catch((err) => {
                console.error("Error fetching revenue data", err);
                setData([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [landlordId]);

    const formatCurrency = (value: number) => {
        if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`;
        return `₱${value}`;
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-2xl shadow-lg text-center">
                <p className="text-gray-500 animate-pulse">Loading revenue data...</p>
            </div>
        );
    }

    const hasValidData = data.length > 0 && !data.every((d) => d.revenue === 0);
    const chartData = hasValidData
        ? data
        : [
              { month: "Jan", revenue: 0 },
              { month: "Feb", revenue: 0 },
              { month: "Mar", revenue: 0 },
          ];

    return (
        <div className="p-5 sm:p-6 bg-white/90 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-xl">

            {/* Header */}
            <div className="flex flex-col mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    Revenue Performance
                </h2>
                <p className="text-sm text-gray-500">
                    Track your earnings month by month
                </p>
            </div>

            {/* Mobile: Area Chart */}
            <ResponsiveContainer width="100%" height={200} className="sm:hidden">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

                    <XAxis
                        dataKey="month"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{
                            background: "white",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "12px",
                        }}
                    />

                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22c55e"
                        strokeWidth={2.2}
                        fill="url(#revGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Desktop: Bar Chart */}
            <ResponsiveContainer width="100%" height={300} className="hidden sm:block">
                <BarChart data={chartData} barSize={28}>
                    <defs>
                        <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#16a34a" />
                            <stop offset="100%" stopColor="#4ade80" />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" vertical={false} />

                    <XAxis
                        dataKey="month"
                        tick={{ fill: "#6b7280", fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fill: "#6b7280", fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{
                            background: "white",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                            padding: "10px",
                        }}
                        cursor={{ fill: "rgba(34,197,94,0.08)" }}
                    />

                    <Bar dataKey="revenue" fill="url(#greenBar)" radius={[14, 14, 0, 0]}>
                        <LabelList
                            position="top"
                            formatter={(value: number) => formatCurrency(value)}
                            fill="#374151"
                            fontSize={12}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Empty-state note */}
            {!hasValidData && (
                <p className="text-center text-sm text-gray-500 mt-3">
                    No revenue data available for this period.
                </p>
            )}
        </div>
    );
};

export default RevenuePerformanceChart;
