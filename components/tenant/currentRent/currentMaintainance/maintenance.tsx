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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -m-4 md:-m-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl">
                <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Maintenance Requests
                </h1>
                <p className="text-sm text-gray-600">
                  Track and manage your property maintenance
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/pages/tenant/maintenance/add?agreement_id=${agreement_id}`}
              >
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200">
                  <PlusIcon className="w-5 h-5" />
                  Create Request
                </button>
              </Link>
              <Link
                href={`/pages/tenant/maintenance/history?agreement_id=${agreement_id}`}
              >
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md">
                  <ClockIcon className="w-5 h-5" />
                  View History
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Filter by Status
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: "all", label: "All Requests", icon: Square3Stack3DIcon },
              { key: "pending", label: "Pending", icon: ClockIcon },
              { key: "scheduled", label: "Scheduled", icon: CalendarDaysIcon },
              {
                key: "in-progress",
                label: "In Progress",
                icon: WrenchScrewdriverIcon,
              },
              { key: "completed", label: "Completed", icon: CheckCircleIcon },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  filter === tab.key
                    ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-2 border-blue-200 shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === tab.key
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
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
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">
                Loading your maintenance requests...
              </span>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WrenchScrewdriverIcon className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {filter === "all"
                  ? "No Maintenance Requests Yet"
                  : `No ${filter.replace("-", " ")} Requests`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === "all"
                  ? "Create your first maintenance request to get started with property maintenance management."
                  : `You don't have any ${filter.replace(
                      "-",
                      " "
                    )} maintenance requests at this time.`}
              </p>
              {filter === "all" && (
                <Link
                  href={`/pages/tenant/maintenance/add?agreement_id=${agreement_id}`}
                >
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
                    <PlusIcon className="w-5 h-5" />
                    Create Your First Request
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.request_id}
                className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="w-full md:w-64 lg:w-80 h-48 md:h-auto flex-shrink-0">
                    {request.photos?.[0] ? (
                      <div className="relative w-full h-full">
                        <img
                          src={request.photos[0]}
                          alt="Maintenance issue"
                          className="w-full h-full object-cover"
                        />
                        {request.photos.length > 1 && (
                          <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                            <PhotoIcon className="w-4 h-4" />
                            {request.photos.length} photos
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm font-medium text-gray-500">
                            No Image
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {request.subject}
                        </h3>
                        <p className="text-gray-600 leading-relaxed line-clamp-2">
                          {request.description}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${getStatusStyle(
                          request.status
                        )} flex-shrink-0`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg">
                          <HomeIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Property
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {request.property_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg">
                          <span className="text-xl">🚪</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Unit
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {request.unit_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg">
                          <span className="text-xl">
                            {getCategoryIcon(request.category)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Category
                          </p>
                          <p className="text-sm font-bold text-gray-900 capitalize">
                            {request.category}
                          </p>
                        </div>
                      </div>

                      {request.created_at && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg">
                            <CalendarDaysIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Created
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(request.created_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && maintenanceRequests.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Request Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Requests",
                  count: statusCounts.all,
                  color: "from-blue-500 to-blue-600",
                  icon: Square3Stack3DIcon,
                },
                {
                  label: "Pending",
                  count: statusCounts.pending,
                  color: "from-amber-500 to-amber-600",
                  icon: ClockIcon,
                },
                {
                  label: "In Progress",
                  count: statusCounts["in-progress"],
                  color: "from-purple-500 to-purple-600",
                  icon: WrenchScrewdriverIcon,
                },
                {
                  label: "Completed",
                  count: statusCounts.completed,
                  color: "from-emerald-500 to-emerald-600",
                  icon: CheckCircleIcon,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border-2 border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}
                    >
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stat.count}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceRequestList;
