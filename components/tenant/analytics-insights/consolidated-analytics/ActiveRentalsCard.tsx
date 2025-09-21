
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
        <div className="w-full p-6 bg-white shadow rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2">Active Rentals</h2>
            <p className="text-3xl font-bold text-green-600">{totalActive}</p>
            <p className="text-sm text-gray-500">Total Active Units</p>
        </div>
    );

}
