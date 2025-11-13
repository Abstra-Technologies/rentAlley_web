"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

export default function PaymentSummaryCard({
  landlord_id,
}: {
  landlord_id: number | undefined;
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
        const totalAmount =
          pendingAmount + overdueAmount + collectedAmount;

        setPending(pendingAmount);
        setOverdue(overdueAmount);
        setCollected(collectedAmount);
        setTotal(totalAmount);
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
      ? ["#d1d5db"]
      : ["#10b981", "#3b82f6", "#f97316"];

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div
      className="
        rounded-2xl border border-gray-200 shadow
        bg-white/30 backdrop-blur-xl
        p-5 md:p-7 
        flex flex-col md:flex-row
        items-center justify-between
        gap-8
      "
    >
      {/* Left Numbers Section */}
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <div>
          <p className="text-sm text-gray-600">Upcoming</p>
          <p className="text-xl font-bold text-blue-600">
            ₱{pending.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-xl font-bold text-orange-600">
            ₱{overdue.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Collected</p>
          <p className="text-xl font-bold text-emerald-600">
            ₱{collected.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex flex-col items-center md:w-1/3">
        <PieChart width={150} height={150}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            dataKey="value"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[idx]} />
            ))}
          </Pie>
        </PieChart>

        <p className="text-xs text-gray-600 mt-1">
          {new Date().toLocaleString("en-US", { month: "long" })}
        </p>
        <p className="text-sm text-gray-800 font-semibold">
          ₱{total.toLocaleString()} total
        </p>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 gap-3 text-sm md:w-1/3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-gray-700">Collected</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-gray-700">Upcoming</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-gray-700">Overdue</span>
        </div>
      </div>
    </div>
  );
}
