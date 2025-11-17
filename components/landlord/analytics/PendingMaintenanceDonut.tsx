"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import axios from "axios";

export default function MaintenanceStatusDonut({ landlordId }: { landlordId: string }) {
  const fetcher = (url: string) => axios.get(url).then((res) => res.data);

  const { data, isLoading } = useSWR(
    landlordId
      ? `/api/analytics/landlord/getMaintenanceStatuses?landlord_id=${landlordId}`
      : null,
    fetcher
  );

  if (isLoading || !data) {
    return (
      <div className="w-full flex flex-col items-center py-6 text-gray-400">
        Loading maintenance…
      </div>
    );
  }

  // Extract values
  const pending = Number(data.pending || 0);
  const approved = Number(data.approved || 0);
  const scheduled = Number(data.scheduled || 0);
  const in_progress = Number(data.in_progress || 0);
  const completed = Number(data.completed || 0);

  const total = pending + approved + scheduled + in_progress + completed;

  // Donut data
  const donutData = [
    { name: "Pending", value: pending },
    { name: "Approved", value: approved },
    { name: "Scheduled", value: scheduled },
    { name: "In Progress", value: in_progress },
    { name: "Completed", value: completed },
  ];

  // Colors (aligned with your MAINTENANCE_STATUS theme)
  const COLORS = [
    "#F59E0B",
    "#3B82F6",
    "#06B6D4",
    "#8B5CF6",
    "#10B981",
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Title */}
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        Maintenance Status Overview
      </h2>
      <p className="text-xs text-gray-500 mb-3">{total} total tasks</p>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="w-40 h-40">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={donutData}
                innerRadius="60%"
                outerRadius="85%"
                dataKey="value"
                paddingAngle={2}
                stroke="none"
                isAnimationActive
                animationBegin={200}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {donutData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend (Right Side) */}
        <div className="flex flex-col text-xs text-gray-700 gap-2">
          {donutData.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: COLORS[i] }}
              ></span>
              {item.name} ({item.value})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
