
"use client";
import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";

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
                const res = await fetch(`/api/landlord/prospective/getAllProspectives?landlordId=${landlordId}`);
                const data = await res.json();
                if (res.ok) {
                    setTenants(data.tenants);
                }
            } catch (err) {
                console.error("Failed to fetch tenants:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTenants();
    }, [landlordId]);

    return (
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-4 border border-gray-200">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                👥 Prospective Tenants
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {tenants.length}
        </span>
            </h3>

            {loading ? (
                <p className="text-sm text-gray-500 py-6 text-center">Loading...</p>
            ) : tenants.length === 0 ? (

                <p className="flex flex-col items-center justify-center text-gray-500 py-6">
                    <UserPlus className="w-8 h-8 mb-2 text-gray-400" />
                    <span className="text-sm">No applications yet.</span>
                </p>

            ) : (

                <ul className="divide-y divide-gray-100">
                    {tenants.map((t) => (
                        <li
                            key={t.id}
                            className="py-3 flex items-center justify-between gap-4"
                        >
                            {/* Left side: avatar + tenant info */}
                            <div className="flex items-center gap-3">
                                {t.user?.profilePicture ? (
                                    <img
                                        src={t.user.profilePicture}
                                        alt={`${t.user.firstName} ${t.user.lastName}`}
                                        className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">
                                        {t.user?.firstName?.charAt(0) || "?"}
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        {t.user?.firstName} {t.user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {t.unit_name} • {t.property_name}
                                    </p>
                                </div>
                            </div>

                            {/* Right side: status + link */}
                            <div className="flex items-center gap-2">
        <span
            className={`px-2 py-1 text-xs rounded-lg font-medium
            ${
                t.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : t.status === "disapproved"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {t.status}
        </span>

                                <a
                                    href={`/pages/landlord/property-listing/view-unit/view-tenant/${t.id}?unit_id=${t.unit_id}&tenant_id=${t.tenant_id}`}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    View
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>

            )}
        </div>
    );
}
