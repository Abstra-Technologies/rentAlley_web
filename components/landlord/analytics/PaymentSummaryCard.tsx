"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export default function PaymentSummaryCard({
  landlord_id,
  onClick,
}: {
  landlord_id: number | undefined;
  onClick?: () => void;
}) {
  const [pending, setPending] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [collected, setCollected] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlord_id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}`
        );
        const data = await res.json();

        const pendingAmount = Number(data.total_pending || 0);
        const overdueAmount = Number(data.total_overdue || 0);
        const collectedAmount = Number(data.total_collected || 0);

        setPending(pendingAmount);
        setOverdue(overdueAmount);
        setCollected(collectedAmount);
        setTotal(pendingAmount + overdueAmount + collectedAmount);
      } catch (err) {
        console.error("Error:", err);
        setPending(0);
        setOverdue(0);
        setCollected(0);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [landlord_id]);

  const data =
    pending === 0 && overdue === 0 && collected === 0
      ? [{ name: "No Data", value: 1 }]
      : [
          { name: "Collected", value: collected },
          { name: "Pending", value: pending },
          { name: "Overdue", value: overdue },
        ];

  const COLORS =
    pending === 0 && overdue === 0 && collected === 0
      ? ["#e5e7eb"]
      : ["#10b981", "#3b82f6", "#f97316"];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="
        relative group cursor-pointer
        bg-white rounded-lg shadow-sm border border-gray-200
        p-4 md:p-6
        transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            Payment Summary
          </h2>
        </div>
        <span className="text-xs text-gray-500">
          {new Date().toLocaleString("en-US", { month: "long" })}
        </span>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Stats Column */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">Upcoming</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 truncate">
                ₱{pending.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">Overdue</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 truncate">
                ₱{overdue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">Collected</p>
              <p className="text-lg md:text-xl font-bold text-emerald-600 truncate">
                ₱{collected.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Column */}
        <div className="flex flex-col items-center justify-center">
          <PieChart width={140} height={140}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              strokeWidth={0}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              ₱{total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Legend Column */}
        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-700">Collected</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-700">Upcoming</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-700">Overdue</span>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-emerald-600/0 group-hover:from-blue-600/5 group-hover:to-emerald-600/5 rounded-lg transition-all duration-200 pointer-events-none" />
    </div>
  );
}
