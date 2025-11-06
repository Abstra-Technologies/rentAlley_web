"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Users } from "lucide-react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AgeGroupData {
  ageGroup: string;
  count: number;
}

export default function TenantAgeGroupChart({
  landlordId,
}: {
  landlordId: number | string;
}) {
  const [data, setData] = useState<AgeGroupData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlordId) return;

    setLoading(true);
    fetch(`/api/analytics/landlord/overview?landlord_id=${landlordId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Analytics API Error:", data.error);
          setLoading(false);
          return;
        }

        if (Array.isArray(data.tenantAgeGroups)) {
          setData(data.tenantAgeGroups);
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

  const ageGroups = data.map((d) => d.ageGroup);
  const tenantCounts = data.map((d) => d.count);
  const totalTenants = data.reduce((sum, item) => sum + item.count, 0);

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
        columnWidth: "55%",
        borderRadius: 6,
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    xaxis: {
      categories: ageGroups,
      labels: {
        style: { colors: "#6B7280", fontSize: "12px", fontWeight: 500 },
      },
    },
    yaxis: {
      labels: { style: { colors: "#6B7280" } },
    },
    colors: ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} tenants`,
      },
    },
    legend: {
      show: false,
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
    },
  };

  const series = [{ name: "Tenants", data: tenantCounts }];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Age Distribution
            </h3>
          </div>
          {data.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {totalTenants}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
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
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              No Data Available
            </h4>
            <p className="text-xs text-gray-600 max-w-xs">
              Age distribution will appear once tenant birth dates are added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
