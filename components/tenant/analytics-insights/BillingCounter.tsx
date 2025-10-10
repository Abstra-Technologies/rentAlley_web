"use client";

import { useEffect, useState } from "react";

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
        return <p className="text-gray-500">Loading billing stats...</p>;
    }

    if (!data) {
        return <p className="text-red-500">No data available</p>;
    }

    const rows = [
        { label: "Total no. of Active Bills", value: data.active_count },
        { label: "Total no. of Past Bills", value: data.past_count },
        { label: "Total no. of Overdue Bills", value: data.overdue_count },
    ];

    return (
        <div className="border rounded-md p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Billing Overview</h2>
            <ul className="space-y-3">
                {rows.map((row) => (
                    <li
                        key={row.label}
                        className="flex justify-between items-center border-b last:border-none pb-2"
                    >
                        <span className="text-gray-700">{row.label}</span>
                        <span className="font-medium">{row.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
