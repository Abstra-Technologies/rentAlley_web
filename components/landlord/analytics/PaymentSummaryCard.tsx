

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
                const totalAmount = pendingAmount + overdueAmount + collectedAmount;

                setPending(pendingAmount);
                setOverdue(overdueAmount);
                setCollected(collectedAmount);
                setTotal(totalAmount);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [landlord_id]);

    if (loading) {
        return (
            <div className="p-6 text-gray-500 text-sm bg-white rounded-xl shadow-sm border border-gray-200">
                Loading payment summary...
            </div>
        );
    }

    const data = [
        { name: "Collected", value: collected },
        { name: "Pending", value: pending },
        { name: "Overdue", value: overdue },
    ];

    const COLORS = ["#22c55e", "#3b82f6", "#fb923c"];
// emerald-500, blue-500, red-500

    return (
        <div>
            {/* Mobile Design (numbers only, stacked cards) */}
            <div className="grid grid-cols-3 gap-3 sm:hidden">
                <div className="rounded-xl bg-gradient-to-br from-sky-800/80 to-sky-600/80 p-3 text-center shadow">
                    <p className="text-base font-bold text-sky-200 drop-shadow">
                        ₱{pending.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-100">Upcoming</p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-orange-800/80 to-orange-600/80 p-3 text-center shadow">
                    <p className="text-base font-bold text-orange-200 drop-shadow">
                        ₱{overdue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-100">Overdue</p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-emerald-800/80 to-emerald-600/80 p-3 text-center shadow">
                    <p className="text-base font-bold text-emerald-200 drop-shadow">
                        ₱{collected.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-100">Collected</p>
                </div>
            </div>

            {/* Tablet/Desktop Design (with chart) */}
            <div
                className="hidden sm:flex rounded-2xl border border-white/10 bg-gradient-to-br from-blue-950/90 via-teal-900/80 to-emerald-900/80
      backdrop-blur-xl shadow-xl p-6 md:p-10 flex-col md:flex-row items-center justify-between gap-6 md:gap-0"
            >
                {/* Upcoming */}
                <div className="text-center flex-1">
                    <p className="text-2xl md:text-3xl font-bold text-sky-300 drop-shadow-md">
                        ₱{pending.toLocaleString()}
                    </p>
                    <p className="text-sm md:text-base text-gray-200">Upcoming</p>

                    <p
                        className="text-3xl md:text-4xl font-bold text-orange-400 mt-4 md:mt-6 drop-shadow-md"
                        style={{ WebkitTextStroke: "0.5px" }}
                    >
                        ₱{overdue.toLocaleString()}
                    </p>
                    <p className="text-sm md:text-base text-gray-200">Overdue</p>
                </div>

                {/* Chart */}
                <div className="flex flex-col items-center justify-center flex-1">
                    <PieChart width={160} height={160} className="md:w-[200px] md:h-[200px]">
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                    </PieChart>
                    <p className="text-sm md:text-base font-medium text-gray-100 mt-2">
                        {new Date().toLocaleString("en-US", { month: "long" })}
                    </p>
                    <p className="text-sm md:text-base text-gray-300">
                        ₱{total.toLocaleString()} Total
                    </p>
                </div>

                {/* Collected */}
                <div className="text-center flex-1">
                    <p className="text-2xl md:text-3xl font-bold text-emerald-300 drop-shadow-md">
                        ₱{collected.toLocaleString()}
                    </p>
                    <p className="text-sm md:text-base text-gray-200">Collected</p>
                </div>
            </div>
        </div>
    );


}
