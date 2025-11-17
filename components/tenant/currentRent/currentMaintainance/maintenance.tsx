"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  HomeIcon,
  Square3Stack3DIcon,
  FunnelIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface Request {
  request_id: number;
  subject: string;
  description: string;
  property_name: string;
  unit_name: string;
  category: string;
  status: string;
  photos?: string[];
  created_at?: string;
}

interface Props {
  agreement_id: number;
  user_id?: number;
}

const MaintenanceRequestList = ({ agreement_id, user_id }: Props) => {
  const [maintenanceRequests, setMaintenanceRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      try {
        const queryParams = new URLSearchParams({
          user_id: user_id?.toString() || "",
        });
        if (agreement_id)
          queryParams.append("agreement_id", agreement_id.toString());
        const response = await axios.get(
          `/api/maintenance/getTenantMaintance?${queryParams.toString()}`
        );

        setMaintenanceRequests(response.data || []);
      } catch (error) {
        console.error("Error fetching maintenance requests:", error);
        setMaintenanceRequests([]);
      } finally {
        setLoading(false);
      }
    };

    if (user_id) fetchMaintenanceRequests();
  }, [user_id, agreement_id]);

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-2 border-amber-200";
      case "scheduled":
        return "bg-blue-50 text-blue-700 border-2 border-blue-200";
      case "in-progress":
        return "bg-purple-50 text-purple-700 border-2 border-purple-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-2 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-2 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return <ClockIcon className="w-4 h-4" />;
      case "scheduled":
        return <CalendarDaysIcon className="w-4 h-4" />;
      case "in-progress":
        return <WrenchScrewdriverIcon className="w-4 h-4" />;
      case "completed":
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    const iconMap: Record<string, string> = {
      plumbing: "🚿",
      electrical: "⚡",
      hvac: "🌡️",
      appliance: "🔌",
      structural: "🏗️",
      cleaning: "🧽",
    };
    return iconMap[normalizedCategory] || "🔧";
  };

  const filteredRequests =
    filter === "all"
      ? maintenanceRequests
      : maintenanceRequests.filter(
          (req) => req.status.toLowerCase() === filter
        );

  const statusCounts = {
    all: maintenanceRequests.length,
    pending: maintenanceRequests.filter(
      (req) => req.status.toLowerCase() === "pending"
    ).length,
    scheduled: maintenanceRequests.filter(
      (req) => req.status.toLowerCase() === "scheduled"
    ).length,
    "in-progress": maintenanceRequests.filter(
      (req) => req.status.toLowerCase() === "in-progress"
    ).length,
    completed: maintenanceRequests.filter(
      (req) => req.status.toLowerCase() === "completed"
    ).length,
  };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 pt-6 md:pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg">
                                <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
                                <p className="text-sm text-gray-600">
                                    Track and manage your property maintenance
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link href={`/pages/tenant/rentalPortal/${agreement_id}/maintenance/add`}>
                                <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all">
                                    <PlusIcon className="w-4 h-4" />
                                    Create Request
                                </button>
                            </Link>
                            <Link href={`/pages/tenant/maintenance/history?agreement_id=${agreement_id}`}>
                                <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 rounded-lg font-medium transition-all shadow-sm">
                                    <ClockIcon className="w-4 h-4" />
                                    View History
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <FunnelIcon className="w-4 h-4 text-gray-600" />
                        <h3 className="text-base font-bold text-gray-900">Filter by Status</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: "all", label: "All", icon: Square3Stack3DIcon },
                            { key: "pending", label: "Pending", icon: ClockIcon },
                            { key: "scheduled", label: "Scheduled", icon: CalendarDaysIcon },
                            { key: "in-progress", label: "In Progress", icon: WrenchScrewdriverIcon },
                            { key: "completed", label: "Completed", icon: CheckCircleIcon },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                                    filter === tab.key
                                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        filter === tab.key
                                            ? "bg-blue-200 text-blue-700"
                                            : "bg-gray-200 text-gray-600"
                                    }`}
                                >
                {statusCounts[tab.key as keyof typeof statusCounts]}
              </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-gray-600 font-medium">
                            Loading your maintenance requests...
                        </p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <WrenchScrewdriverIcon className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {filter === "all"
                                ? "No Maintenance Requests Yet"
                                : `No ${filter.replace("-", " ")} Requests`}
                        </h3>
                        <p className="text-gray-600 mb-5 text-sm">
                            {filter === "all"
                                ? "Create your first maintenance request to get started."
                                : `You don't have any ${filter.replace("-", " ")} maintenance requests right now.`}
                        </p>
                        {filter === "all" && (
                            <Link href={`/pages/tenant/maintenance/add?agreement_id=${agreement_id}`}>
                                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all">
                                    <PlusIcon className="w-4 h-4" />
                                    Create Request
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.request_id}
                                className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-3 flex flex-col sm:flex-row items-start gap-3"
                            >
                                {/* Image Section - compact */}
                                <div
                                    className="relative w-full sm:w-40 h-28 flex-shrink-0 cursor-zoom-in"
                                    onClick={() => setZoomedImage(request.photos?.[0])}
                                >
                                    {request.photos?.[0] ? (
                                        <img
                                            src={request.photos[0]}
                                            alt="Maintenance issue"
                                            className="w-full h-full object-cover rounded-md border border-gray-200 hover:opacity-90 transition"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                {/* Content Section - tighter spacing */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-base font-bold text-gray-900">
                                            {request.subject}
                                        </h3>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${getStatusStyle(
                                                request.status
                                            )}`}
                                        >
                    {getStatusIcon(request.status)}
                                            {request.status}
                  </span>
                                    </div>

                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {request.description}
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                                        <div>
                                            <p className="font-semibold text-gray-500 uppercase text-[11px]">Property</p>
                                            <p className="text-gray-800 font-medium">{request.property_name}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-500 uppercase text-[11px]">Unit</p>
                                            <p className="text-gray-800 font-medium">{request.unit_name}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-500 uppercase text-[11px]">Category</p>
                                            <p className="text-gray-800 font-medium capitalize">{request.category}</p>
                                        </div>
                                        {request.created_at && (
                                            <div>
                                                <p className="font-semibold text-gray-500 uppercase text-[11px]">
                                                    Created
                                                </p>
                                                <p className="text-gray-800 font-medium">
                                                    {new Date(request.created_at).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Image Zoom Modal */}
                {zoomedImage && (
                    <div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                        onClick={() => setZoomedImage(null)}
                    >
                        <img
                            src={zoomedImage}
                            alt="Zoomed"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
                        />
                    </div>
                )}
            </div>
        </div>
    );

};

export default MaintenanceRequestList;
