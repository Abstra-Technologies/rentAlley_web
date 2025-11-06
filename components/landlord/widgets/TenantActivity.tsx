"use client";
import { useEffect, useState } from "react";
import { Inbox } from "lucide-react"; // ✅ added icon

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
            <div
                className="flex items-center justify-center min-h-[180px] sm:min-h-[220px]
        bg-white rounded-2xl border border-gray-100 shadow-md
        transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-center"
            >
                <p className="text-sm sm:text-base text-gray-500">Loading tenant activities...</p>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-[180px] sm:min-h-[220px]
        bg-white rounded-2xl border border-gray-100 shadow-md
        transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-center"
            >
                <Inbox className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-2" />
                <p className="text-sm sm:text-base text-gray-500 font-medium">
                    No tenant activities found.
                </p>
            </div>
        );
    }

    // ✅ Only show top 5 most recent
    const visibleActivities = activities.slice(0, 5);

    return (
        <div
            className="bg-white rounded-2xl border border-gray-100 shadow-md
      transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
        >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Tenant Activity Log
                </h2>
                <span className="text-[11px] sm:text-xs text-gray-500">
          Showing latest 5 activities
        </span>
            </div>

            {/* Activity Feed */}
            <div className="divide-y divide-gray-100">
                {visibleActivities.map((act) => (
                    <div
                        key={act.log_id}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center hover:bg-gray-50 transition-all duration-200"
                    >
                        {/* Avatar */}
                        <img
                            src={act.profilePicture || "/default-avatar.png"}
                            alt="Tenant"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full mr-3 sm:mr-4 object-cover"
                        />

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base text-gray-800 leading-tight">
                <span className="font-medium text-gray-900">
                  {act.firstName} {act.lastName}
                </span>{" "}
                                {act.action}
                            </p>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">
                                {act.property_name} • Unit {act.unit_name}
                            </p>
                        </div>

                        {/* Timestamp */}
                        <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap ml-2">
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
        </div>
    );
}
