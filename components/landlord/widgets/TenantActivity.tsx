

"use client";
import { useEffect, useState } from "react";

interface TenantActivity {
    log_id: number;
    action: string;
    timestamp: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    property_name: string;
    unit_name: string;
}

export default function TenantActivity({
                                           landlord_id,
                                       }: {
    landlord_id: number | undefined;
}) {
    const [activities, setActivities] = useState<TenantActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/landlord/${landlord_id}/tenantActivityLog`);
                const data = await res.json();
                setActivities(data);
            } catch (err) {
                console.error("Failed to fetch tenant activity:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [landlord_id]);

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                Loading tenant activities...
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                No tenant activities found.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                    Tenant Activity Log
                </h2>
                <span className="text-xs text-gray-500">
        Showing latest 10 activities
      </span>
            </div>

            {/* Activity Feed */}
            <div className="divide-y divide-gray-100">
                {activities.slice(0, 10).map((act) => (
                    <div
                        key={act.log_id}
                        className="px-6 py-4 flex items-center hover:bg-gray-50 transition"
                    >
                        {/* Avatar */}
                        <img
                            src={act.profilePicture || "/default-avatar.png"}
                            alt="Tenant"
                            className="w-11 h-11 rounded-full mr-4 object-cover"
                        />

                        {/* Details */}
                        <div className="flex-1">
                            <p className="text-sm text-gray-800">
              <span className="font-medium text-gray-900">
                {act.firstName} {act.lastName}
              </span>{" "}
                                {act.action}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {act.property_name} • Unit {act.unit_name}
                            </p>
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(act.timestamp).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 text-center">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    View Full Activity
                </button>
            </div>
        </div>
    );

}
