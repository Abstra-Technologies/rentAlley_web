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
                console.error("Error fetching data:", err);
                // ✅ Ensure zero state still renders chart
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

    if (loading) {
        return (
            <div className="p-4 text-gray-500 text-xs bg-white rounded-lg shadow-sm border border-gray-200">
                Loading payment summary...
            </div>
        );
    }

    // ✅ Always render chart (even if all 0)
    const data =
        pending === 0 && overdue === 0 && collected === 0
            ? [
                { name: "No Data", value: 1 }, // placeholder slice
            ]
            : [
                { name: "Collected", value: collected },
                { name: "Pending", value: pending },
                { name: "Overdue", value: overdue },
            ];

    const COLORS =
        pending === 0 && overdue === 0 && collected === 0
            ? ["#e5e7eb"] // light gray when no data
            : ["#22c55e", "#3b82f6", "#fb923c"];

    return (
        <div>
            {/* Mobile Design (compact stacked cards) */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
                <div className="rounded-lg bg-gradient-to-br from-sky-800/80 to-sky-600/80 p-2 text-center shadow">
                    <p className="text-sm font-bold text-sky-200">
                        ₱{pending.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-100">Upcoming</p>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-orange-800/80 to-orange-600/80 p-2 text-center shadow">
                    <p className="text-sm font-bold text-orange-200">
                        ₱{overdue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-100">Overdue</p>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-emerald-800/80 to-emerald-600/80 p-2 text-center shadow">
                    <p className="text-sm font-bold text-emerald-200">
                        ₱{collected.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-100">Collected</p>
                </div>
            </div>

            {/* Tablet/Desktop Design (compact with chart) */}
            <div
                className="hidden sm:flex rounded-xl border border-white/10
          bg-gradient-to-br from-blue-950/90 via-teal-900/80 to-emerald-900/80
          backdrop-blur-xl shadow-lg p-6 md:p-10 flex-col md:flex-row
          items-center justify-between gap-6 min-h-[280px]"
            >
                {/* Upcoming + Overdue */}
                <div className="text-center flex-1">
                    <p className="text-lg md:text-xl font-bold text-sky-300">
                        ₱{pending.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm text-gray-200">Upcoming</p>

                    <p className="text-xl md:text-2xl font-bold text-orange-400 mt-2 md:mt-4">
                        ₱{overdue.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm text-gray-200">Overdue</p>
                </div>

                {/* Chart */}
                <div className="flex flex-col items-center justify-center flex-1">
                    <PieChart
                        width={120}
                        height={120}
                        className="md:w-[150px] md:h-[150px]"
                    >
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            dataKey="value"
                            isAnimationActive={false} // ✅ keeps static circle for no data
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                    </PieChart>
                    <p className="text-xs md:text-sm font-medium text-gray-100 mt-1">
                        {new Date().toLocaleString("en-US", { month: "long" })}
                    </p>
                    <p className="text-xs md:text-sm text-gray-300">
                        ₱{total.toLocaleString()} Total
                    </p>
                </div>

                {/* Collected */}
                <div className="text-center flex-1">
                    <p className="text-lg md:text-xl font-bold text-emerald-300">
                        ₱{collected.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm text-gray-200">Collected</p>
                </div>
            </div>
        </div>
    );
}
