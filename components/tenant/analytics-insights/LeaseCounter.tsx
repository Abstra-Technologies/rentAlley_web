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
      <div className="w-full h-40 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-100 border-t-emerald-500"></div>
          <p className="text-gray-500 text-xs mt-3 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-600 text-sm font-medium">No data available</p>
        </div>
      </div>
    );
  }

  const totalLeases =
    Number(data.active_count) +
    Number(data.expired_count) +
    Number(data.pending_count) +
    Number(data.cancelled_count);

  const items = [
    {
      label: "Active",
      value: data.active_count,
      icon: CheckCircleIcon,
      gradient: "from-emerald-500 to-teal-500",
      lightBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
    },
    {
      label: "Pending",
      value: data.pending_count,
      icon: ClockIcon,
      gradient: "from-amber-500 to-orange-500",
      lightBg: "bg-gradient-to-br from-amber-50 to-orange-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
    },
    {
      label: "Expired",
      value: data.expired_count,
      icon: XCircleIcon,
      gradient: "from-rose-500 to-pink-500",
      lightBg: "bg-gradient-to-br from-rose-50 to-pink-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
    },
    {
      label: "Cancelled",
      value: data.cancelled_count,
      icon: XCircleIcon,
      gradient: "from-slate-500 to-gray-500",
      lightBg: "bg-gradient-to-br from-slate-50 to-gray-50",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-gray-700 text-sm font-semibold tracking-wide uppercase">
          Lease Contracts
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {totalLeases}
          </p>
          <p className="text-gray-500 text-sm font-medium">total leases</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`${item.lightBg} border ${item.borderColor} rounded-xl p-4 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all duration-300 group cursor-default`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2.5 bg-gradient-to-br ${item.gradient} rounded-xl flex-shrink-0`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm sm:text-base font-medium truncate">
                    {item.label}
                  </span>
                </div>
                <span
                  className={`text-2xl sm:text-3xl font-bold ${item.textColor} flex-shrink-0 ml-2`}
                >
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
