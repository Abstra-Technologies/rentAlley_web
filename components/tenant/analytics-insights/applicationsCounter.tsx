"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";

interface ApplicationsCounterData {
  pending_count: number;
  approved_count: number;
  disapproved_count: number;
}

export default function ApplicationsCounter({
  tenantId,
}: {
  tenantId: number;
}) {
  const [data, setData] = useState<ApplicationsCounterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/tenant/analytics/applicationsCounter?tenantId=${tenantId}`
        );
        if (!res.ok) throw new Error("Failed to fetch counters");
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch application counters:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-10 w-10 border-3 border-transparent border-t-blue-500"></div>
          </div>
          <p className="text-gray-500 text-xs font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-600 text-sm font-semibold">
            No data available
          </p>
          <p className="text-gray-500 text-xs mt-1">Please try again</p>
        </div>
      </div>
    );
  }

  const totalApplications =
    Number(data.pending_count) +
    Number(data.approved_count) +
    Number(data.disapproved_count);

  const stats = [
    {
      label: "Pending",
      value: data.pending_count,
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
      icon: ClockIcon,
    },
    {
      label: "Approved",
      value: data.approved_count,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      icon: CheckCircleIcon,
    },
    {
      label: "Declined",
      value: data.disapproved_count,
      bgColor: "bg-rose-50",
      textColor: "text-rose-700",
      iconColor: "text-rose-600",
      borderColor: "border-rose-200",
      icon: XCircleIcon,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - Consistent across all counters */}
      <div className="mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <DocumentCheckIcon className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Applications
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold text-gray-900 tabular-nums leading-none">
            {totalApplications}
          </p>
          <span className="text-sm font-medium text-gray-500 pb-0.5">
            {totalApplications === 1 ? "application" : "applications"}
          </span>
        </div>
      </div>

      {/* Stats Grid - Consistent layout with padding for 3 items */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} ${
                stat.borderColor
              } border rounded-xl p-3.5 hover:shadow-md transition-all duration-300 cursor-default ${
                index === 2 ? "col-span-2" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                <span
                  className={`text-2xl font-bold ${stat.textColor} tabular-nums leading-none`}
                >
                  {stat.value}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-700">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
