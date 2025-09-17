
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Tenant {
    user_id: string;
    firstName: string;
    lastName: string;
    unit_name: string;
    secDepositPaid: boolean;
    advPaymentPaid: boolean;
}

interface Props {
    landlord_id?: number; // optional to avoid undefined errors
}

export const PaidDepositsWidget: React.FC<Props> = ({ landlord_id }) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!landlord_id) return;

        setLoading(true);
        setError(null);

        const fetchTenants = async () => {
            try {
                const res = await axios.get(`/api/landlord/secAdv/${landlord_id}/payments-secAdv`);
                setTenants(res.data.tenants || []);
            } catch (err: any) {
                console.error(err);
                setError("Failed to fetch tenants.");
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, [landlord_id]);

    if (!landlord_id) return <div className="p-4 border rounded">Landlord not loaded.</div>;
    if (loading) return <div className="p-4 border rounded">Loading...</div>;
    if (error) return <div className="p-4 border rounded text-red-600">{error}</div>;
    if (!tenants.length) return <div className="p-4 border rounded">No tenants have paid yet.</div>;

    return (
        <div className="p-5 border rounded-lg shadow-md w-full max-w-md bg-white">
            <ul className="divide-y divide-gray-200 max-h-72 overflow-y-auto">
                {tenants.map((t) => (
                    <li
                        key={t.user_id}
                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-md transition"
                    >
                        <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {t.firstName} {t.lastName}
            </span>
                            <span className="text-xs text-gray-500">
              {t.property_name} • {t.unit_name}
            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );

};
