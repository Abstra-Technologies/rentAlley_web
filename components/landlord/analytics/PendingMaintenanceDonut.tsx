"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import axios from "axios";
import { Wrench, Clock } from "lucide-react";

export default function PendingMaintenanceDonut({
  landlordId,
}: {
  landlordId: string;
}) {
  const fetcher = (url: string) => axios.get(url).then((res) => res.data);

  const { data, isLoading } = useSWR(
    landlordId
      ? `/api/analytics/landlord/getMaintenanceStatuses?landlord_id=${landlordId}`
      : null,
    fetcher
  );

  const { data: todayWorkOrders } = useSWR(
    landlordId
      ? `/api/analytics/landlord/getTodayMaintenance?landlord_id=${landlordId}`
      : null,
    fetcher
  );

  // STATUS LABELS
  const STATUS_LABELS: Record<string, string> = {
    Pending: "Pending",
    Approved: "Approved",
    Scheduled: "Scheduled",
    "In-Progress": "In Progress",
    Completed: "Completed",
  };

  const STATUS_COLORS: Record<string, string> = {
    Pending: "#F59E0B",
    Approved: "#3B82F6",
    Scheduled: "#06B6D4",
    "In-Progress": "#8B5CF6",
    Completed: "#10B981",
  };

  const ORDERED_STATUSES = [
    "Pending",
    "Approved",
    "Scheduled",
    "In-Progress",
    "Completed",
  ];

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const donutData = ORDERED_STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: Number(data[status] || 0),
  }));

  const total = donutData.reduce((n, item) => n + item.value, 0);
  const isAllZero = donutData.every((s) => s.value === 0);

  const chartData = isAllZero ? [{ name: "No Data", value: 1 }] : donutData;
  const chartColors = isAllZero
    ? ["#E5E7EB"]
    : ORDERED_STATUSES.map((status) => STATUS_COLORS[status]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            Maintenance Overview
          </h2>
        </div>
        <span className="text-xs text-gray-500">{total} total</span>
      </div>

      {/* Donut Chart + Legend */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* Chart */}
        <div className="w-32 h-32">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius="60%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="none"
              >
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={chartColors[idx]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {!isAllZero ? (
            donutData.map((item, idx) => {
              const rawKey = ORDERED_STATUSES[idx];
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[rawKey] }}
                  />
                  <span className="text-xs text-gray-700">
                    {item.name} ({item.value})
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">No maintenance requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Work Section */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Today's Scheduled Work
          </h3>
        </div>

        {!todayWorkOrders || todayWorkOrders.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No work scheduled today</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {todayWorkOrders.map((work: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all"
              >
                <p className="font-medium text-sm text-gray-900 mb-1">
                  {work.subject}
                </p>
                <p className="text-xs text-gray-600">
                  {work.unit_name} • {work.schedule_time}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
