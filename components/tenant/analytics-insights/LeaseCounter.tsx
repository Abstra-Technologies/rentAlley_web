"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface LeaseCounterData {
  active_count: number;
  expired_count: number;
  pending_count: number;
  cancelled_count: number;
}

export default function LeaseCounter({ tenantId }: { tenantId: number }) {
  const [data, setData] = useState<LeaseCounterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/tenant/analytics/lease/counter?tenantId=${tenantId}`
        );
        if (!res.ok) throw new Error("Failed to fetch counters");
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="w-full text-center py-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-gray-200 border-t-blue-500"></div>
        <p className="text-gray-500 text-sm mt-2">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full text-center py-6">
        <ExclamationCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <p className="text-red-600 text-sm font-medium">No data available</p>
      </div>
    );
  }

  const totalLeases =
    Number(data.active_count) +
    Number(data.expired_count) +
    Number(data.pending_count) +
    Number(data.cancelled_count);

  const stats = [
    {
      label: "Active",
      value: data.active_count,
      icon: CheckCircleIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Pending",
      value: data.pending_count,
      icon: ClockIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Expired",
      value: data.expired_count,
      icon: XCircleIcon,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Cancelled",
      value: data.cancelled_count,
      icon: XCircleIcon,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          Lease Contracts
        </h3>
        <p className="text-2xl font-bold text-gray-900">{totalLeases}</p>
        <p className="text-xs text-gray-500 mt-0.5">Total Leases</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
