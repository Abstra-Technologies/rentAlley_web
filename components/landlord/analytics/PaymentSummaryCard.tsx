"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

export default function PaymentSummaryCard({
  landlord_id,
  onClick,
}: {
  landlord_id: number | undefined;
  onClick?: () => void; // optional click handler
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
      ? ["#d1d5db"]
      : ["#10b981", "#3b82f6", "#f97316"];

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm text-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div
    onClick={onClick}
    className="
      relative group cursor-pointer
      rounded-2xl border border-gray-200 shadow
      bg-white/30 backdrop-blur-xl
      p-5 md:p-7 
      flex flex-col md:flex-row
      items-center justify-between
      gap-8
      transition-all duration-300 
      hover:-translate-y-1 hover:shadow-xl
       h-[300px] 
    "
  >
    {/* OVERLAY EFFECT */}
    <div
      className="
        absolute inset-0 rounded-2xl 
        bg-gradient-to-r from-blue-600/0 via-emerald-400/0 to-emerald-600/0
        group-hover:from-blue-600/10 group-hover:via-emerald-400/10 group-hover:to-emerald-600/10
        opacity-0 group-hover:opacity-100 
        transition-all duration-300 
        pointer-events-none
      "
    />

    {/* CTA BUTTON (TOP RIGHT) */}
    <div
      className="
        absolute top-3 right-4
        opacity-0 group-hover:opacity-100
        transition-opacity duration-300 
        pointer-events-none     /* ⛔ does NOT block chart hover */
        z-20
      "
    >
      <span
        className="
          bg-white/90 text-gray-800 
          text-xs sm:text-sm font-medium 
          px-3 py-1 
          rounded-full shadow-md backdrop-blur-md
        "
      >
        View Payment History →
      </span>
    </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-4 w-full md:w-1/3 z-10">
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

      {/* DONUT CHART */}
      <div className="flex flex-col items-center md:w-1/3 z-10">
        <PieChart width={150} height={150}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            strokeWidth={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[i]} />
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

      {/* LEGEND */}
      <div className="flex flex-col gap-1.5 text-sm md:w-1/3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
          <span className="text-gray-700">Collected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          <span className="text-gray-700">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
          <span className="text-gray-700">Overdue</span>
        </div>
      </div>
    </div>
  );
}
