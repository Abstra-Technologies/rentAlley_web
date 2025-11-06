"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Wrench } from "lucide-react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MaintenanceCategoriesChartProps {
  landlordId: string | number;
}

export default function MaintenanceCategoriesChart({
  landlordId,
}: MaintenanceCategoriesChartProps) {
  const [data, setData] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlordId) return;

    setLoading(true);
    fetch(`/api/analytics/landlord/overview?landlord_id=${landlordId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.error) {
          console.error("Analytics API Error:", result.error);
          setLoading(false);
          return;
        }

        if (Array.isArray(result.maintenanceCategories)) {
          setData(result.maintenanceCategories);
        } else {
          setData([]);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching analytics overview:", error);
        setLoading(false);
      });
  }, [landlordId]);

  const totalRequests = data.reduce((sum, item) => sum + item.count, 0);

  const chartOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    labels: data.map((item) => item.name || "Uncategorized"),
    legend: {
      position: "bottom",
      labels: { colors: "#374151" },
      fontSize: "12px",
      fontWeight: 500,
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Requests",
              fontSize: "14px",
              fontWeight: 600,
              color: "#111827",
              formatter: () => totalRequests.toString(),
            },
          },
        },
      },
    },
    stroke: {
      width: 2,
      colors: ["#fff"],
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} requests`,
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 280 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  const chartSeries = data.map((item) => item.count);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Maintenance Categories
            </h3>
          </div>
          {data.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {totalRequests}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-600">Loading data...</p>
          </div>
        ) : data.length > 0 ? (
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            height={300}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              No Data Available
            </h4>
            <p className="text-xs text-gray-600 max-w-xs">
              Maintenance request data will appear here once requests are
              logged.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
