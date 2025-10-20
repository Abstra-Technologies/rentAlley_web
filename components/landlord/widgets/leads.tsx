"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, UserCheck, UserX } from "lucide-react";

type ProspectiveTenant = {
    id: number;
    tenant_id: number;
    first_name: string;
    last_name: string;
    unit_name: string;
    property_name: string;
    status: "pending" | "approved" | "disapproved";
    proceeded: "yes" | "no" | null;
    created_at: string;
};

export default function ProspectiveTenantsWidget({ landlordId }: { landlordId: number }) {
    const [tenants, setTenants] = useState<ProspectiveTenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTenants() {
            try {
                const res = await fetch(
                    `/api/landlord/prospective/getAllProspectives?landlordId=${landlordId}`
                );
                const data = await res.json();
                if (res.ok) setTenants(data.tenants || []);
            } catch (err) {
                console.error("Failed to fetch tenants:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTenants();
    }, [landlordId]);

    return (
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-4 border border-gray-200 mx-auto">
            {/* Header */}
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                👥 Prospective Tenants
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tenants.length}
                </span>
            </h3>

            {/* Loading State */}
            {loading ? (
                <p className="text-sm text-gray-500 py-6 text-center animate-pulse">
                    Loading...
                </p>
            ) : tenants.length === 0 ? (
                /* Empty State */
                <p className="flex flex-col items-center justify-center text-gray-500 py-6">
                    <UserPlus className="w-8 h-8 mb-2 text-gray-400" />
                    <span className="text-sm">No applications yet.</span>
                </p>
            ) : (
                <>
                    {/* Tenants List */}
                    <ul className="divide-y divide-gray-100">
                        {tenants.slice(0, 5).map((t) => (
                            <li
                                key={t.id}
                                className="py-3 flex items-center justify-between gap-4"
                            >
                                {/* Left: Avatar + Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">
                                        {t.first_name.charAt(0)}
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {t.first_name} {t.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {t.unit_name} • {t.property_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Status Badge + Icon */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-lg font-medium ${
                                            t.status === "approved"
                                                ? "bg-green-100 text-green-700"
                                                : t.status === "disapproved"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {t.status}
                                    </span>

                                    {t.status === "approved" ? (
                                        <UserCheck className="w-4 h-4 text-green-600" />
                                    ) : t.status === "disapproved" ? (
                                        <UserX className="w-4 h-4 text-red-600" />
                                    ) : (
                                        <UserPlus className="w-4 h-4 text-yellow-600" />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Show All Link */}
                    {tenants.length > 5 && (
                        <div className="mt-4 text-center">
                            <Link
                                href="/pages/landlord/prospective-tenants"
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                Show All
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
