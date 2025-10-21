"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

interface BillingCounterData {
  active_count: number;
  past_count: number;
  overdue_count: number;
}

export default function BillingCounter({ tenantId }: { tenantId: number }) {
  const [data, setData] = useState<BillingCounterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/tenant/analytics/bill/counter?tenantId=${tenantId}`
        );
        if (!res.ok) throw new Error("Failed to fetch billing counters");
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
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-600 text-sm font-medium">No data available</p>
        </div>
      </div>
    );
  }

  const totalBills =
    Number(data.active_count) +
    Number(data.past_count) +
    Number(data.overdue_count);

  const items = [
    {
      label: "Active Bills",
      value: data.active_count,
      icon: BoltIcon,
      gradient: "from-blue-500 to-cyan-500",
      lightBg: "bg-gradient-to-br from-blue-50 to-cyan-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      description: "Current & upcoming",
    },
    {
      label: "Past Bills",
      value: data.past_count,
      icon: CheckCircleIcon,
      gradient: "from-emerald-500 to-teal-500",
      lightBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
      description: "Paid & settled",
    },
    {
      label: "Overdue Bills",
      value: data.overdue_count,
      icon: ExclamationTriangleIcon,
      gradient: "from-rose-500 to-red-500",
      lightBg: "bg-gradient-to-br from-rose-50 to-red-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
      description: "Requires attention",
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-gray-700 text-sm font-semibold tracking-wide uppercase">
          Billing Overview
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {totalBills}
          </p>
          <p className="text-gray-500 text-sm font-medium">bills</p>
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2.5 bg-gradient-to-br ${item.gradient} rounded-xl flex-shrink-0 mt-0.5`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm sm:text-base font-semibold">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-2xl sm:text-3xl font-bold ${item.textColor} flex-shrink-0`}
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
