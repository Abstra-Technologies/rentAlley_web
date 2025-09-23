
"use client";

import { useEffect, useState } from "react";

interface ApplicationsCounterData {
    pending_count: number;
    approved_count: number;
    disapproved_count: number;
}

export default function ApplicationsCounter({
                                                tenantId,
                                            }: {
    tenantId: number;
}) {
    const [data, setData] = useState<ApplicationsCounterData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;

        const fetchData = async () => {
            try {
                const res = await fetch(
                    `/api/tenant/analytics/applicationsCounter?tenantId=${tenantId}`
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
        return <p className="text-gray-500">Loading application stats...</p>;
    }

    if (!data) {
        return <p className="text-red-500">No data available</p>;
    }

    const rows = [
        { label: "Pending Applications", value: data.pending_count },
        { label: "Approved Applications", value: data.approved_count },
        { label: "Disapproved Applications", value: data.disapproved_count },
    ];

    return (
        <div className="border rounded-md p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Applications</h2>
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
