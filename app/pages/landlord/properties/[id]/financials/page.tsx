"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { useParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/utils/formatter/formatters";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

import useSubscription from "@/hooks/landlord/useSubscription";
import useAuthStore from "@/zustand/authStore";
import { subscriptionConfig } from "@/constant/subscription/limits";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";


const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function FinancialsPage() {
  const { id } = useParams();
  const propertyId = id;

    const { user } = useAuthStore();
    const router = useRouter();

    const landlordId = user?.landlord_id;

    const { subscription, loadingSubscription } =
        useSubscription(landlordId);


    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showNOIChart, setShowNOIChart] = useState(false);
  const [showGrossChart, setShowGrossChart] = useState(false);

  const { data, isLoading } = useSWR(
    propertyId
      ? `/api/analytics/landlord/revenue-expense-trend?property_id=${propertyId}&year=${selectedYear}`
      : null,
    fetcher
  );

    const planName =
        subscription?.plan_name as keyof typeof subscriptionConfig;

    const planConfig = planName
        ? subscriptionConfig[planName]
        : null;

    const canUseFinancials =
        planConfig?.features?.financialInsights === true;

    const allowedHistoryYears =
        planConfig?.limits?.financialHistoryYears;


    const metrics = data?.metrics || {};

  const chartDataNOI = {
    labels: metrics.monthNames || [],
    datasets: [
      {
        label: "NOI Trend",
        data: metrics.noiTrend || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartGrossRent = {
    labels: metrics.monthNames || [],
    datasets: [
      {
        label: "Gross Rent Trend",
        data: metrics.grossRentTrend || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: function (value) {
            return "₱" + value.toLocaleString();
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

    const currentYear = new Date().getFullYear();

    const allowedYears =
        allowedHistoryYears === null
            ? [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]
            : Array.from({ length: allowedHistoryYears }, (_, i) => currentYear - i);


    if (isLoading) {
    return (
      <div className="pb-24 md:pb-6">
        <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

    if (!loadingSubscription && !canUseFinancials) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md w-full text-center">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                        <BarChart3 className="w-7 h-7 text-white" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Upgrade Required
                    </h2>

                    <p className="text-gray-600 text-sm mb-6">
                        Financial Insights are not available on your current plan.
                        Upgrade to view revenue and performance analytics.
                    </p>

                    <button
                        onClick={() =>
                            router.push("/pages/landlord/subsciption_plan/pricing")
                        }
                        className="w-full px-5 py-2.5 rounded-xl font-semibold text-white
          bg-gradient-to-r from-blue-600 to-emerald-600
          hover:from-blue-700 hover:to-emerald-700 transition-all"
                    >
                        View Plans
                    </button>
                </div>
            </div>
        );
    }


    return (
    <div className="pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Financial Dashboard
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                Revenue and expense insights for Property #{propertyId}
              </p>
            </div>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                  value={selectedYear}
                  onChange={(e) => {
                      const year = Number(e.target.value);

                      if (
                          allowedHistoryYears !== null &&
                          currentYear - year >= allowedHistoryYears
                      ) {
                          Swal.fire({
                              icon: "warning",
                              title: "Upgrade Required",
                              text: "Your plan allows limited financial history.",
                              confirmButtonColor: "#3b82f6",
                          });
                          return;
                      }

                      setSelectedYear(year);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              >
                  {allowedYears.map((year) => (
                      <option key={year} value={year}>
                          {year}
                      </option>
                  ))}
              </select>

          </div>
        </div>

        {/* NOI Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              Net Operating Income (NOI)
            </h2>
          </div>

          {/* NOI Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <MetricCard
              label="Month to Month"
              value={formatCurrency(metrics.noi?.mtm?.current)}
              last={formatCurrency(metrics.noi?.mtm?.last)}
              variance={metrics.noi?.mtm?.variance}
            />
            <MetricCard
              label="Year to Date"
              value={formatCurrency(metrics.noi?.ytd?.current)}
              last={formatCurrency(metrics.noi?.ytd?.last)}
              variance={metrics.noi?.ytd?.variance}
            />
            <MetricCard
              label="Year Over Year"
              value={formatCurrency(metrics.noi?.yoy?.current)}
              last={formatCurrency(metrics.noi?.yoy?.last)}
              variance={metrics.noi?.yoy?.variance}
            />
          </div>

          {/* NOI Chart */}
          <ChartSection
            title="Monthly NOI Trend"
            isOpen={showNOIChart}
            onToggle={() => setShowNOIChart(!showNOIChart)}
          >
            <Line data={chartDataNOI} options={chartOptions} />
          </ChartSection>
        </div>

        {/* Gross Rent Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              Gross Rent
            </h2>
          </div>

          {/* Gross Rent Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <MetricCard
              label="Month to Month"
              value={formatCurrency(metrics.grossRent?.mtm?.current)}
              last={formatCurrency(metrics.grossRent?.mtm?.last)}
              variance={metrics.grossRent?.mtm?.variance}
            />
            <MetricCard
              label="Year to Date"
              value={formatCurrency(metrics.grossRent?.ytd?.current)}
              last={formatCurrency(metrics.grossRent?.ytd?.last)}
              variance={metrics.grossRent?.ytd?.variance}
            />
            <MetricCard
              label="Year Over Year"
              value={formatCurrency(metrics.grossRent?.yoy?.current)}
              last={formatCurrency(metrics.grossRent?.yoy?.last)}
              variance={metrics.grossRent?.yoy?.variance}
            />
          </div>

          {/* Gross Rent Chart */}
          <ChartSection
            title="Gross Rent Trend"
            isOpen={showGrossChart}
            onToggle={() => setShowGrossChart(!showGrossChart)}
          >
            <Line data={chartGrossRent} options={chartOptions} />
          </ChartSection>
        </div>
      </div>
    </div>
  );
}

/* ======================================
   METRIC CARD COMPONENT
====================================== */
function MetricCard({ label, value, last, variance }) {
  const isPositive = variance >= 0;

  return (
    <div className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <p className="text-xs md:text-sm text-gray-600 font-medium mb-2">
        {label}
      </p>

      <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
        {value || "₱0.00"}
      </p>
      <p className="text-xs md:text-sm text-gray-500">
        Last: {last || "₱0.00"}
      </p>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span
            className={`text-sm font-semibold ${
              isPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {variance?.toFixed(2) || "0.00"}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ======================================
   CHART SECTION WITH TOGGLE
====================================== */
function ChartSection({ title, children, isOpen, onToggle }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <h3 className="text-sm md:text-base font-semibold text-gray-900">
          {title}
        </h3>
        <div
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </div>
      </button>

      {/* Chart Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 border-t border-gray-100">
          <div className="w-full h-[300px] md:h-[400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
