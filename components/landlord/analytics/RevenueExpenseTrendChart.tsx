"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TrendData = {
  months: string[];
  revenue: number[];
  expenses: number[];
};

export default function RevenueExpenseTrendChart({
  landlordId,
}: {
  landlordId: number | string;
}) {
  const [trend, setTrend] = useState<TrendData>({
    months: [],
    revenue: [],
    expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!landlordId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(
      `/api/analytics/landlord/revenue-expense-trend?landlord_id=${landlordId}`
    )
      .then((res) => res.json())
      .then((data) => {
        // ✅ Validate the data structure before setting state
        if (data && typeof data === "object") {
          setTrend({
            months: Array.isArray(data.months) ? data.months : [],
            revenue: Array.isArray(data.revenue) ? data.revenue : [],
            expenses: Array.isArray(data.expenses) ? data.expenses : [],
          });
        } else {
          // If data is invalid, set empty state
          setTrend({
            months: [],
            revenue: [],
            expenses: [],
          });
        }
        setError(false);
      })
      .catch((err) => {
        console.error("Error fetching trend data:", err);
        setError(true);
        // Set empty state on error
        setTrend({
          months: [],
          revenue: [],
          expenses: [],
        });
      })
      .finally(() => setLoading(false));
  }, [landlordId]);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
      fontFamily: "inherit",
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      categories: trend.months || [], // ✅ Fallback to empty array
      labels: {
        style: { colors: "#6B7280", fontSize: "12px", fontWeight: 500 },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280" },
        formatter: (value) => `₱${value.toLocaleString()}`,
      },
    },
    colors: ["#10B981", "#EF4444"],
    dataLabels: { enabled: false },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: { colors: "#374151" },
      fontSize: "13px",
      fontWeight: 500,
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value) => `₱${value.toLocaleString()}`,
      },
    },
    markers: {
      size: 4,
      colors: ["#10B981", "#EF4444"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
  };

  const series = [
    { name: "Revenue", data: trend.revenue || [] }, // ✅ Fallback to empty array
    { name: "Expenses", data: trend.expenses || [] }, // ✅ Fallback to empty array
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px]">
        <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-600">Loading financial data...</p>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px] sm:h-[400px] text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-10 h-10 text-red-600" />
        </div>
        <h4 className="text-base font-semibold text-gray-900 mb-2">
          Unable to Load Data
        </h4>
        <p className="text-sm text-gray-600 max-w-md">
          There was an error loading the financial trend data. Please try
          refreshing the page.
        </p>
      </div>
    );
  }

  // ✅ Safe check for empty data
  if (
    !trend.months ||
    !Array.isArray(trend.months) ||
    trend.months.length === 0
  ) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px] sm:h-[400px] text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-10 h-10 text-emerald-600" />
        </div>
        <h4 className="text-base font-semibold text-gray-900 mb-2">
          No Financial Data Available
        </h4>
        <p className="text-sm text-gray-600 max-w-md">
          Revenue and expense trends will appear once you start recording
          payments and utility bills.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Chart options={options} series={series} type="line" height={400} />
      <p className="text-gray-600 text-xs sm:text-sm text-center mt-4">
        Monthly comparison between property revenue and concessionaire expenses
      </p>
    </div>
  );
}
