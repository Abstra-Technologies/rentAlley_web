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
import { TrendingUp, DollarSign } from "lucide-react";

const RevenuePerformanceChart = ({ landlord_id }: { landlord_id: number }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlord_id) return;

    setLoading(true);
    axios
      .get(
        `/api/analytics/landlord/getRevenuePerformance?landlordId=${landlord_id}`
      )
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
  }, [landlord_id]);

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`;
    return `₱${value}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        {/* Chart Skeleton - Mobile */}
        <div className="md:hidden space-y-2 animate-pulse">
          <div className="flex items-end justify-between h-32 gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-lg"
                style={{ height: `${Math.random() * 60 + 40}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
              <span key={m} className="w-8 h-3 bg-gray-200 rounded"></span>
            ))}
          </div>
        </div>

        {/* Chart Skeleton - Desktop */}
        <div className="hidden md:block space-y-3 animate-pulse">
          <div className="flex items-end justify-between h-64 gap-3">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-emerald-200 to-emerald-100 rounded-t-lg"
                style={{ height: `${Math.random() * 70 + 30}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {[
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
            ].map((m) => (
              <span key={m} className="w-6 h-3 bg-gray-200 rounded"></span>
            ))}
          </div>
        </div>
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
        { month: "Apr", revenue: 0 },
        { month: "May", revenue: 0 },
        { month: "Jun", revenue: 0 },
      ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            Revenue Performance
          </h2>
        </div>
        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
      </div>

      {/* Mobile: Area Chart */}
      <div className="md:hidden">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />

            <Tooltip
              formatter={(v) => formatCurrency(Number(v))}
              contentStyle={{
                background: "white",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "11px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#revGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Desktop: Bar Chart */}
      <div className="hidden md:block">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barSize={32}>
            <defs>
              <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />

            <Tooltip
              formatter={(v) => formatCurrency(Number(v))}
              contentStyle={{
                background: "white",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: "8px 12px",
                fontSize: "13px",
              }}
              cursor={{ fill: "rgba(16, 185, 129, 0.1)" }}
            />

            <Bar dataKey="revenue" fill="url(#greenBar)" radius={[8, 8, 0, 0]}>
              <LabelList
                position="top"
                formatter={(value: number) =>
                  value > 0 ? formatCurrency(value) : ""
                }
                fill="#374151"
                fontSize={11}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Empty State */}
      {!hasValidData && (
        <div className="text-center py-4 mt-4 border-t border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600">No revenue data available yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Revenue will appear once payments are recorded
          </p>
        </div>
      )}
    </div>
  );
};

export default RevenuePerformanceChart;
