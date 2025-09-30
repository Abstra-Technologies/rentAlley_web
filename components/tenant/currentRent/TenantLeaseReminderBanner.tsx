
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
    const [leases, setLeases] = useState<any[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (!tenantId) return;

        const fetchPendingLeases = async () => {
            try {
                const res = await axios.get(
                    `/api/tenant/lease/pending?tenant_id=${tenantId}`
                );
                setLeases(res.data.pendingLeases || []);
                console.log("lease info: ", res.data.pendingLeases);
            } catch (err) {
                console.error("Error fetching leases:", err);
            }
        };

        fetchPendingLeases();
    }, [tenantId]);

    if (!leases || leases.length === 0) return null;

    // leases to display
    const visibleLeases = showAll ? leases : [leases[0]];

    return (
        <div className="space-y-4">
            {visibleLeases.map((lease) => (
                <div
                    key={lease.agreement_id}
                    className="w-full bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
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
                            <p className="text-xs text-gray-500 mt-1">
                                {lease.start_date} → {lease.end_date}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 sm:mt-0 sm:ml-4">
                        <button
                            onClick={() =>
                                (window.location.href = `/pages/tenant/leaseAgreement/signing?envelopeId=${lease.docusign_envelope_id}`)
                            }
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
                        >
                            Sign Lease Now
                        </button>
                    </div>
                </div>
            ))}

            {/* Toggle only if more than 1 lease */}
            {leases.length > 1 && (
                <div className="text-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
                    >
                        {showAll ? "Show Less" : `Show All (${leases.length})`}
                    </button>
                </div>
            )}
        </div>
    );
}
