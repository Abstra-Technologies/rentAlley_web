
"use client";

import { useEffect, useState } from "react";

interface BillingDetail {
    billing_id: number;
    billing_period: string;
    total_amount_due: number;
    status: string;
    due_date: string;
}

interface UnitPayable {
    unit_id: number;
    unit_name: string;
    property_name: string;
    rent_amount: number;
    sec_deposit: number;
    advanced_payment: number;
    total_due: number;
    billing_details: BillingDetail[];
}

interface PayablesResponse {
    total: number;
    details: UnitPayable[];
}

export default function TenantPayables({ tenant_id }: { tenant_id: number | undefined }) {
    const [data, setData] = useState<PayablesResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tenant_id) return;

        setLoading(true);
        fetch(`/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`)
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [tenant_id]);

    if (!tenant_id) return <p>Please login.</p>;
    if (loading) return <p>Loading...</p>;
    if (!data || !data.details.length) return <p>No payables found.</p>;

    return (
        <div className="space-y-4 w-full">
            <div className="p-4 bg-blue-100 rounded-lg shadow">
                <h2 className="text-xl font-bold">Total Payable</h2>
                <p className="text-2xl font-semibold">{data.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
            </div>

            <div className="space-y-2">
                {data.details.map(unit => (
                    <div key={unit.unit_id} className="p-4 border rounded-lg">
                        <h3 className="font-bold">{unit.unit_name} - {unit.property_name}</h3>
                        <p className="font-semibold">Total Due: {unit.total_due.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
