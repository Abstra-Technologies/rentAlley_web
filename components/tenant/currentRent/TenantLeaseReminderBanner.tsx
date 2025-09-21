
"use client";

import { useEffect, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import axios from "axios";

interface TenantLeaseReminderBannerProps {
    tenantId: number; // Pass tenant_id here
}

export default function TenantLeaseReminderBanner({
                                                      tenantId,
                                                  }: TenantLeaseReminderBannerProps) {
    const [lease, setLease] = useState<any>(null);

    useEffect(() => {
        if (!tenantId) return;
        const fetchPendingLease = async () => {
            try {
                const res = await axios.get(
                    `/api/tenant/lease/pending?tenant_id=${tenantId}`
                );
                setLease(res.data.pendingLease);
            } catch (err) {
                console.error("Error fetching lease:", err);
            }
        };
        fetchPendingLease();
    }, [tenantId]);

    if (!lease) return null; // No pending lease

    return (
        <div className="w-full bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-amber-800">
                        Pending Lease Agreement
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                        Please review and sign your lease for{" "}
                        <span className="font-semibold">
              {lease.property_name} – Unit {lease.unit_name}
            </span>
                        .
                    </p>
                </div>
            </div>

            <div className="mt-3 sm:mt-0 sm:ml-4">
                <a
                    href={lease.agreement_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
                >
                    Sign Lease Now
                </a>
            </div>
        </div>
    );
}
