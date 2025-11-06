"use client";

import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Zap } from "lucide-react";

type UtilityRate = {
  property_id: number;
  property_name: string;
  avg_water_consumption: number;
  avg_electricity_consumption: number;
};

type Props = {
  landlordId: number | string;
};

export default function PropertyUtilitiesChart({ landlordId }: Props) {
  const [utilityRates, setUtilityRates] = useState<UtilityRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlordId) return;

    setLoading(true);
    fetch(
      `/api/analytics/landlord/getAveragePropertyUtilityRate?landlord_id=${landlordId}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Average Utility Data:", data);
        if (Array.isArray(data)) setUtilityRates(data);
        else setUtilityRates([]);
      })
      .catch((error) =>
        console.error("Error fetching property utility data:", error)
      )
      .finally(() => setLoading(false));
  }, [landlordId]);

  const propertyNames = utilityRates.map((item) => item.property_name);
  const waterRates = utilityRates.map(
    (item) => item.avg_water_consumption || 0
  );
  const electricityRates = utilityRates.map(
    (item) => item.avg_electricity_consumption || 0
  );

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
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: propertyNames,
      labels: {
        style: { colors: "#6B7280", fontSize: "12px", fontWeight: 500 },
        rotate: -45,
        rotateAlways: propertyNames.length > 3,
      },
    },
    yaxis: {
      labels: { style: { colors: "#6B7280" } },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: { colors: "#374151" },
      fontSize: "12px",
      fontWeight: 500,
    },
    colors: ["#3B82F6", "#F59E0B"],
    tooltip: {
      theme: "light",
      y: {
        formatter: (val: number) => `${val.toFixed(2)} avg`,
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
    },
  };

  const series = [
    { name: "Water (m³)", data: waterRates },
    { name: "Electricity (kWh)", data: electricityRates },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Utility Consumption
            </h3>
          </div>
          {utilityRates.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
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
              {utilityRates.length}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-600">Loading data...</p>
          </div>
        ) : utilityRates.length > 0 ? (
          <Chart
            // @ts-ignore
            options={chartOptions}
            series={series}
            type="bar"
            height={300}
          />
        ) : (
          <div className="flex flex-col justify-center items-center h-[300px] text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              No Data Available
            </h4>
            <p className="text-xs text-gray-600 max-w-xs">
              Utility consumption data will appear once billing is recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
