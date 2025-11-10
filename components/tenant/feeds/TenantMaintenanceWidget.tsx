"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    WrenchScrewdriverIcon,
    BuildingOfficeIcon,
    ClockIcon,
    CheckCircleIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";

interface MaintenanceRequest {
    request_id: number;
    subject: string;
    description: string;
    property_name: string;
    unit_name: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    photo?: string | null;
}

export default function TenantMaintenanceWidget({
                                                    tenant_id,
                                                }: {
    tenant_id?: string;
}) {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tenant_id) {
            setLoading(false);
            return;
        }

        const fetchMaintenanceRequests = async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `/api/maintenance/getMaintenancebyTenantId?tenant_id=${tenant_id}`
                );
                if (!res.ok) throw new Error("Failed to fetch maintenance requests");
                const data = await res.json();

                // ✅ Sort by date descending and get only the top 5
                const sorted = (data?.maintenance_requests || []).sort(
                    (a: MaintenanceRequest, b: MaintenanceRequest) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setRequests(sorted.slice(0, 5));
            } catch (err: any) {
                setError(err.message || "Unable to load maintenance requests");
            } finally {
                setLoading(false);
            }
        };

        fetchMaintenanceRequests();
    }, [tenant_id]);

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "bg-red-100 text-red-700 border-red-200";
            case "scheduled":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "in-progress":
            case "in_progress":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "completed":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600 text-sm font-medium">
                    Loading maintenance requests...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 font-semibold">{error}</p>
            </div>
        );
    }

    if (!requests.length) {
        return (
            <div className="text-center py-10">
                <WrenchScrewdriverIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                    No maintenance requests yet across your units.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-sm">
                        <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Latest Maintenance Requests</h2>
                </div>

                {/* View All */}
                <Link
                    href="/pages/tenant/maintenance"
                    className="text-sm font-semibold text-emerald-600 hover:underline"
                >
                    View All
                </Link>
            </div>

            {/* List */}
            <div className="space-y-4">
                {requests.map((req) => (
                    <div
                        key={req.request_id}
                        className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 p-4"
                    >
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Left: Image */}
                            <div className="relative w-full sm:w-32 h-24 flex-shrink-0">
                                {req.photo ? (
                                    <img
                                        src={req.photo}
                                        alt="Maintenance photo"
                                        className="w-full h-full object-cover rounded-md border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                                        <PhotoIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Right: Details */}
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-bold text-gray-900">
                                        {req.subject}
                                    </h3>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${getStatusBadge(
                                            req.status
                                        )}`}
                                    >
                    {req.status}
                  </span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {req.description}
                                </p>

                                {/* Property + Priority + Date */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs">
                                    <div>
                                        <p className="font-semibold text-gray-500 uppercase text-[11px]">
                                            Property
                                        </p>
                                        <p className="text-gray-800 font-medium">
                                            {req.property_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-500 uppercase text-[11px]">
                                            Unit
                                        </p>
                                        <p className="text-gray-800 font-medium">{req.unit_name}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-500 uppercase text-[11px]">
                                            Priority
                                        </p>
                                        <p
                                            className={`font-semibold ${
                                                req.priority.toLowerCase() === "high"
                                                    ? "text-red-600"
                                                    : req.priority.toLowerCase() === "medium"
                                                        ? "text-amber-600"
                                                        : "text-gray-700"
                                            }`}
                                        >
                                            {req.priority}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                    <p>
                                        Created:{" "}
                                        <span className="font-medium text-gray-800">
                      {new Date(req.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                      })}
                    </span>
                                    </p>

                                    <Link
                                        href={`/pages/tenant/maintenance?unit=${encodeURIComponent(
                                            req.unit_name
                                        )}`}
                                        className="text-emerald-600 font-semibold text-xs hover:underline"
                                    >
                                        View
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
