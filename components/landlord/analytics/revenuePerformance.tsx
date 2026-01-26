"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CARD_CONTAINER_INTERACTIVE,
  EMPTY_STATE_ICON,
  GRADIENT_PRIMARY,
  SECTION_HEADER,
  GRADIENT_DOT,
  SECTION_TITLE,
} from "@/constant/design-constants";

/* ---------------- ApexCharts (CLIENT ONLY) ---------------- */
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] md:h-[320px] bg-gray-100 rounded-lg animate-pulse" />
  ),
});

/* ---------------- Constants ---------------- */
const ALL_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface RevenueData {
  month: string;
  revenue: number;
}

interface Props {
  landlord_id: string;
}

export default function RevenuePerformanceChart({ landlord_id }: Props) {
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  /* ---------------- SWR Data Fetch ---------------- */
  const { data = [], isLoading } = useSWR<RevenueData[]>(
    `/api/analytics/landlord/getRevenuePerformance?landlordId=${landlord_id}&year=${selectedYear}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    },
  );

  /* ---------------- Normalize Data to 12 Months ---------------- */
  const chartData = useMemo(() => {
    const revenueMap = new Map<string, number>();
    data.forEach((item) => {
      revenueMap.set(item.month, Number(item.revenue) || 0);
    });

    return ALL_MONTHS.map((month, index) => ({
      month,
      revenue: revenueMap.get(month) ?? 0,
      isCurrent: selectedYear === currentYear && index === currentMonthIndex,
      isFuture: selectedYear === currentYear && index > currentMonthIndex,
    }));
  }, [data, selectedYear, currentYear, currentMonthIndex]);

  const hasValidData = chartData.some((d) => d.revenue > 0);

  /* ---------------- Currency Formatter ---------------- */
  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`;
    return `₱${value.toLocaleString()}`;
  };

  /* ---------------- Chart Series ---------------- */
  const series = useMemo(
    () => [
      {
        name: "Revenue",
        data: chartData.map((d) => d.revenue),
      },
    ],
    [chartData],
  );

  /* ---------------- Base Chart Options ---------------- */
  const baseOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: !isLoading && hasValidData,
        easing: "easeinout" as const,
        speed: 600,
      },
    },
    xaxis: {
      categories: ALL_MONTHS,
      labels: { style: { fontSize: "12px", colors: "#6b7280" } },
    },
    yaxis: {
      labels: {
        formatter: formatCurrency,
        style: { colors: "#6b7280" },
      },
    },
    tooltip: {
      y: { formatter: formatCurrency },
    },
    grid: { strokeDashArray: 4, borderColor: "#e5e7eb" },
    colors: ["#10b981"],
    dataLabels: { enabled: false },
  };

  /* ---------------- Loading State ---------------- */
  if (isLoading) {
    return (
      <div className={CARD_CONTAINER_INTERACTIVE}>
        <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="h-[220px] md:h-[320px] bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push("/pages/landlord/analytics/detailed/revenue")}
      className={CARD_CONTAINER_INTERACTIVE}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={SECTION_HEADER}>
          <span className={GRADIENT_DOT} />
          <div>
            <h2 className={SECTION_TITLE}>Revenue Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Monthly revenue breakdown
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div
          className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border"
          onClick={(e) => e.stopPropagation()}
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-sm font-medium bg-transparent focus:outline-none cursor-pointer"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </div>
      </div>

      {/* Mobile: Smooth Area Chart */}
      <div className="md:hidden">
        <Chart
          type="area"
          height={240}
          series={series}
          options={{
            ...baseOptions,
            fill: {
              type: "gradient",
              gradient: {
                shadeIntensity: 0.8,
                opacityFrom: 0.5,
                opacityTo: 0.05,
                stops: [0, 90],
              },
            },
            stroke: { curve: "smooth", width: 3 },
          }}
        />
      </div>

      {/* Desktop: Bar Chart with Highlighting */}
      <div className="hidden md:block">
        <Chart
          type="bar"
          height={340}
          series={series}
          options={{
            ...baseOptions,
            plotOptions: {
              bar: {
                columnWidth: "50%",
                borderRadius: 8,
                colors: {
                  ranges: chartData.map((_, i) => ({
                    from: i,
                    to: i,
                    color: chartData[i].isCurrent
                      ? "#16a34a"
                      : chartData[i].isFuture
                        ? "#dcfce7"
                        : "#10b981",
                  })),
                },
              },
            },
          }}
        />
      </div>

      {/* Empty State */}
      {!hasValidData && (
        <div className="text-center py-8 mt-4 border-t border-gray-100">
          <div className={EMPTY_STATE_ICON}>
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-base font-medium text-gray-700">
            No revenue recorded yet
          </p>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            Revenue data will appear here once tenants start making payments.
          </p>
        </div>
      )}
    </div>
  );
}
