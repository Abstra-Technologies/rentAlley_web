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
    security_deposit_amount: number;
    advance_payment_amount: number;
    total_due: number;
    billing_details: BillingDetail[];
}

interface PayablesResponse {
    total: number;
    details: UnitPayable[];
}

export default function TenantPayables({
                                           tenant_id,
                                       }: {
    tenant_id: number | undefined;
}) {
    const [data, setData] = useState<PayablesResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tenant_id) return;

        setLoading(true);
        fetch(
            `/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`
        )
            .then((res) => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [tenant_id]);

    if (!tenant_id) return <p>Please login.</p>;
    if (loading) return <p>Loading...</p>;
    if (!data || !data.details.length) return <p>No payables found.</p>;

    return (
        <div className="space-y-4 w-full">
            {/* Total */}
            <div className="p-4 bg-blue-500 rounded-lg shadow text-white text-center">
                <h2 className="text-xl">Total Payable</h2>
                <p className="text-4xl font-semibold">
                    {data.total.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                    })}
                </p>
            </div>

            {/* Per-Unit Breakdown */}
            <div className="space-y-2">
                {data.details.map((unit) => (
                    <div
                        key={unit.unit_id}
                        className="p-3 border rounded-lg flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-sm font-medium text-gray-800">
                                {unit.unit_name} – {unit.property_name}
                            </h3>
                            <p className="text-xs text-gray-500">
                                Rent:{" "}
                                {unit.rent_amount.toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                })}
                                {unit.security_deposit_amount > 0 && (
                                    <> | Deposit: ₱{unit.security_deposit_amount}</>
                                )}
                                {unit.advance_payment_amount > 0 && (
                                    <> | Advance: ₱{unit.advance_payment_amount}</>
                                )}
                            </p>
                        </div>

                        <p className="text-sm font-semibold text-gray-700">
                            {unit.total_due.toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                            })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
