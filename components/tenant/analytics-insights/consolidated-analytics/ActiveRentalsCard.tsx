
// components/TenantFeedsCard.tsx
"use client";

import { useEffect, useState } from "react";

interface UnitInfo {
    unit_id: number;
    unit_name: string;
    property_name: string;
    status: string;
}

interface TenantFeedsCardProps {
    tenant_id?: number;
}

export default function ActiveRentConsolidatedCards({ tenant_id }: TenantFeedsCardProps) {
    const [totalActive, setTotalActive] = useState<number>(0);
    const [units, setUnits] = useState<UnitInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!tenant_id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/analytics/tenant/consolidated/activeRentals?tenant_id=${tenant_id}`);
                const data = await res.json();
                setTotalActive(data.totalActiveUnits);
                setUnits(data.units);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenant_id]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-4 w-full">
            <h2 className="text-xl font-semibold mb-2">Active Rentals</h2>
            <div className="text-lg mb-4">Total Active Units: {totalActive}</div>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {units.map((unit) => (
                    <li
                        key={unit.unit_id}
                        className="p-2 border rounded flex justify-between items-center"
                    >
                        <div>
                            <div className="font-medium">{unit.unit_name}</div>
                            <div className="text-sm text-gray-500">{unit.property_name}</div>
                        </div>
                        <span
                            className={`text-xs px-2 py-1 rounded ${
                                unit.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                        >
              {unit.status}
            </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
