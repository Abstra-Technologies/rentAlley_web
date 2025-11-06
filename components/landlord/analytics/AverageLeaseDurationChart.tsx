"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Calendar } from "lucide-react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LeaseDurationData {
  property_id: number;
  property_name: string;
  avg_lease_months: number;
}

export default function AverageLeaseDurationChart({
  landlordId,
}: {
  landlordId: number;
}) {
  const [data, setData] = useState<LeaseDurationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlordId) return;

    setLoading(true);
    fetch(
      `/api/analytics/landlord/getAverageLeaseDuration?landlord_id=${landlordId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setData(data);
        else setData([]);
      })
      .catch((error) =>
        console.error("Error fetching average lease duration:", error)
      )
      .finally(() => setLoading(false));
  }, [landlordId]);

  const propertyNames = data.map((d) => d.property_name);
  const avgDurations = data.map((d) => d.avg_lease_months);

  const chartOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
      animations: { easing: "easeinout", speed: 800 },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}mo`,
      style: {
        fontSize: "11px",
        fontWeight: 600,
      },
    },
    xaxis: {
      categories: propertyNames,
      labels: {
        style: { colors: "#6B7280", fontSize: "12px", fontWeight: 500 },
        rotate: -45,
        rotateAlways: propertyNames.length > 3,
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280" },
        formatter: (val: number) => `${val.toFixed(0)}`,
      },
    },
    colors: ["#10B981"],
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toFixed(1)} months`,
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
    },
  };

  const series = [{ name: "Avg Duration", data: avgDurations }];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Lease Duration
            </h3>
          </div>
          {data.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              {data.length}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-600">Loading data...</p>
          </div>
        ) : data.length > 0 ? (
          <Chart
            // @ts-ignore
            options={chartOptions}
            series={series}
            type="bar"
            height={300}
          />
        ) : (
          <div className="flex flex-col justify-center items-center h-[300px] text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              No Data Available
            </h4>
            <p className="text-xs text-gray-600 max-w-xs">
              Lease duration averages will appear once lease dates are recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
