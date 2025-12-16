"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

/* ---------------- ApexCharts (CLIENT ONLY) ---------------- */
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ---------------- Constants ---------------- */
const ALL_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

export default function RevenuePerformanceChart({
                                                    landlord_id,
                                                }: {
    landlord_id: number;
}) {
    const router = useRouter();

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const [year, setYear] = useState(currentYear);

    /* ---------------- SWR ---------------- */
    const { data, isLoading } = useSWR(
        landlord_id
            ? `/api/analytics/landlord/getRevenuePerformance?landlordId=${landlord_id}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        }
    );

    /* ---------------- Normalize Data (12 months) ---------------- */
    const chartData = useMemo(() => {
        const map = new Map<string, number>();

        if (Array.isArray(data)) {
            data.forEach((d: any) => {
                map.set(d.month, Number(d.revenue) || 0);
            });
        }

        return ALL_MONTHS.map((month, index) => ({
            month,
            revenue: map.get(month) ?? 0,
            isCurrent: index === currentMonthIndex && year === currentYear,
            isFuture: year === currentYear && index > currentMonthIndex,
        }));
    }, [data, year, currentYear, currentMonthIndex]);

    const hasValidData = chartData.some((d) => d.revenue > 0);

    /* ---------------- Helpers ---------------- */
    const formatCurrency = (value: number) => {
        if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`;
        return `₱${value}`;
    };

    /* ---------------- Apex Series ---------------- */
    const series = [
        {
            name: "Revenue",
            data: chartData.map((d) => d.revenue),
        },
    ];

    /* ---------------- Apex Options ---------------- */
    const baseOptions = {
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: {
                enabled: hasValidData,
                easing: "easeinout",
                speed: 600,
            },
        },
        xaxis: {
            categories: ALL_MONTHS,
            labels: {
                style: { fontSize: "12px" },
            },
        },
        yaxis: {
            labels: {
                formatter: formatCurrency,
            },
        },
        tooltip: {
            y: {
                formatter: formatCurrency,
            },
        },
        grid: {
            strokeDashArray: 4,
        },
        colors: ["#10b981"],
        dataLabels: {
            enabled: false,
        },
    };

    /* ---------------- Loading ---------------- */
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 animate-pulse">
                <div className="h-5 w-1/3 bg-gray-200 rounded mb-6" />
                <div className="h-[260px] bg-gray-100 rounded" />
            </div>
        );
    }

    return (
        <div
            className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition cursor-pointer"
            onClick={() =>
                router.push("/pages/landlord/analytics/detailed/revenue")
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-sm md:text-base font-semibold text-gray-900">
                        Revenue Performance
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Monthly revenue overview
                    </p>
                </div>

                {/* Year Selector (UI-only) */}
                <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="text-xs border rounded-md px-2 py-1 bg-white"
                    >
                        <option value={currentYear}>{currentYear}</option>
                        <option value={currentYear - 1}>{currentYear - 1}</option>
                        <option value={currentYear - 2}>{currentYear - 2}</option>
                    </select>
                </div>
            </div>

            {/* ---------------- Mobile: Area Chart ---------------- */}
            <div className="md:hidden">
                <Chart
                    type="area"
                    height={220}
                    series={series}
                    options={{
                        ...baseOptions,
                        fill: {
                            type: "gradient",
                            gradient: {
                                shadeIntensity: 1,
                                opacityFrom: 0.35,
                                opacityTo: 0.05,
                                stops: [0, 100],
                            },
                        },
                        stroke: {
                            curve: "smooth",
                            width: 2,
                        },
                    }}
                />
            </div>

            {/* ---------------- Desktop: Bar Chart ---------------- */}
            <div className="hidden md:block">
                <Chart
                    type="bar"
                    height={320}
                    series={series}
                    options={{
                        ...baseOptions,
                        plotOptions: {
                            bar: {
                                columnWidth: "45%",
                                borderRadius: 6,
                                colors: {
                                    ranges: chartData.map((d, i) => ({
                                        from: i,
                                        to: i,
                                        color: d.isCurrent
                                            ? "#22c55e"
                                            : d.isFuture
                                                ? "#d1fae5"
                                                : "#10b981",
                                    })),
                                },
                            },
                        },
                    }}
                />
            </div>

            {/* ---------------- Empty State ---------------- */}
            {!hasValidData && (
                <div className="text-center py-4 mt-4 border-t">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-sm text-gray-600">No revenue yet</p>
                    <p className="text-xs text-gray-500">
                        Revenue will appear once payments are recorded
                    </p>
                </div>
            )}
        </div>
    );
}
