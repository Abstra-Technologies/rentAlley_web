"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Calendar as CalendarIcon } from "lucide-react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Lease = {
  agreement_id: number;
  property_name: string;
  unit_name: string;
  end_date: string;
  status: string;
};

type Props = {
  landlordId: number | string;
};

export default function LeaseExpiryForecast({ landlordId }: Props) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlordId) return;

    setLoading(true);
    fetch(
      `/api/analytics/landlord/getLeaseExpiryForecast?landlord_id=${landlordId}`
    )
      .then((res) => res.json())
      .then((data: Lease[]) => {
        setLeases(data);

        // Group leases by month of expiry
        const monthCount: Record<string, number> = {};
        data.forEach((lease) => {
          if (lease.end_date) {
            const date = new Date(lease.end_date);
            const monthLabel = date.toLocaleString("en-US", {
              month: "short",
              year: "numeric",
            });
            monthCount[monthLabel] = (monthCount[monthLabel] || 0) + 1;
          }
        });

        const sortedMonths = Object.keys(monthCount)
          .sort(
            (a, b) =>
              new Date(a + " 01").getTime() - new Date(b + " 01").getTime()
          )
          .slice(0, 12);

        setCategories(sortedMonths);
        setSeries([
          {
            name: "Leases Expiring",
            data: sortedMonths.map((m) => monthCount[m] || 0),
          },
        ]);
      })
      .catch((error) =>
        console.error("Failed to fetch lease expiry data:", error)
      )
      .finally(() => setLoading(false));
  }, [landlordId]);

  const totalExpiring = series[0]?.data.reduce((a, b) => a + b, 0) || 0;

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: "#6B7280", fontSize: "12px", fontWeight: 500 },
        rotate: -45,
      },
    },
    yaxis: {
      labels: { style: { colors: "#6B7280" } },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: "50%",
        distributed: true,
      },
    },
    colors: ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e"],
    tooltip: {
      y: {
        formatter: (value) =>
          `${value} lease${value === 1 ? "" : "s"} expiring`,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ["#111827"],
        fontSize: "11px",
        fontWeight: 600,
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
    },
    legend: { show: false },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Lease Expiry Forecast
            </h3>
          </div>
          {categories.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {totalExpiring}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">Next 12 months</p>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-600">Loading data...</p>
          </div>
        ) : categories.length > 0 ? (
          <Chart
            options={chartOptions}
            series={series}
            type="bar"
            height={300}
          />
        ) : (
          <div className="flex flex-col justify-center items-center h-[300px] text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              No Data Available
            </h4>
            <p className="text-xs text-gray-600 max-w-xs">
              Lease expiry forecast will appear once lease end dates are
              recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
