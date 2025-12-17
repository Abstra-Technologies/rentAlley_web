"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Tenant {
    user_id: string;
    firstName: string;
    lastName: string;
    property_name: string;
    unit_name: string;
    secDepositPaid: boolean;
    advPaymentPaid: boolean;
}

interface Props {
    landlord_id?: number;
}

const MAX_ITEMS = 5;

export const PaidDepositsWidget: React.FC<Props> = ({ landlord_id }) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!landlord_id) return;

        const fetchTenants = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axios.get(
                    `/api/landlord/secAdv/${landlord_id}/payments-secAdv`
                );
                setTenants(res.data?.tenants || []);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch tenants.");
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, [landlord_id]);

    /* =======================
       EMPTY / ERROR STATES
    ======================= */

    if (!landlord_id) {
        return (
            <div className="py-12 text-center text-sm text-gray-600">
                Landlord not loaded
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading tenants…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
        );
    }

    if (!tenants.length) {
        return (
            <div className="py-12 text-center">
                <h3 className="text-sm font-semibold text-gray-900">
                    No Deposits Yet
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                    Tenant deposits will appear here once paid.
                </p>
            </div>
        );
    }

    /* =======================
       MAIN RENDER
    ======================= */

    const visibleTenants = tenants.slice(0, MAX_ITEMS);

    return (
        <div className="space-y-3">
            {visibleTenants.map((tenant) => (
                <div
                    key={tenant.user_id}
                    className="
            flex flex-col gap-4
            bg-white border border-gray-200
            rounded-lg p-4
            lg:flex-row lg:items-center lg:justify-between
          "
                >
                    {/* LEFT → Tenant Info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center text-sm font-bold text-blue-600">
                            {tenant.firstName?.[0]}
                            {tenant.lastName?.[0]}
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {tenant.firstName} {tenant.lastName}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                                {tenant.property_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                Unit: {tenant.unit_name}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT → Payment Status */}
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:w-[320px]">
                        {/* Security Deposit */}
                        <StatusBadge
                            label="Security Deposit"
                            paid={tenant.secDepositPaid}
                        />

                        {/* Advance Payment */}
                        <StatusBadge
                            label="Advance Payment"
                            paid={tenant.advPaymentPaid}
                        />
                    </div>
                </div>
            ))}

            {tenants.length > MAX_ITEMS && (
                <p className="text-xs text-gray-500 text-center pt-2">
                    Showing {MAX_ITEMS} of {tenants.length} tenants
                </p>
            )}
        </div>
    );
};

/* =======================
   STATUS BADGE COMPONENT
======================= */

function StatusBadge({
                         label,
                         paid,
                     }: {
    label: string;
    paid: boolean;
}) {
    return (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-xs font-medium text-gray-700">{label}</span>

            {paid ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-700">
          ✓ Paid
        </span>
            ) : (
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-600">
          ⏳ Pending
        </span>
            )}
        </div>
    );
}
