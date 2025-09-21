
"use client";

import { useEffect, useState } from "react";

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
                const res = await fetch(`/api/tenant/analytics/lease/counter?tenantId=${tenantId}`);
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
        return <p className="text-gray-500">Loading lease stats...</p>;
    }

    if (!data) {
        return <p className="text-red-500">No data available</p>;
    }

    const rows = [
        { label: "Total no. of Active", value: data.active_count },
        { label: "Total no. of Expired", value: data.expired_count },
        { label: "Total no. of Pending", value: data.pending_count },
        { label: "Total no. of Cancelled", value: data.cancelled_count },
    ];

    return (
        <div className="border rounded-md p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Lease Contracts</h2>
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
