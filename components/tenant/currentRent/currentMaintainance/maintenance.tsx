"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

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
        // @ts-ignore
        const queryParams = new URLSearchParams({
          user_id: user_id?.toString(),
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
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "⏳";
      case "scheduled":
        return "📅";
      case "in-progress":
        return "🔧";
      case "completed":
        return "✅";
      default:
        return "❓";
    }
  };

  const getCategoryIcon = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    switch (normalizedCategory) {
      case "plumbing":
        return "🚿";
      case "electrical":
        return "⚡";
      case "hvac":
        return "🌡️";
      case "appliance":
        return "🔌";
      case "structural":
        return "🏗️";
      case "cleaning":
        return "🧽";
      default:
        return "🔧";
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Maintenance Requests
              </h1>
              <p className="text-gray-600">
                Track and manage your property maintenance requests
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/pages/tenant/maintenance/add?agreement_id=${agreement_id}`}
              >
                <button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 font-medium">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Request
                </button>
              </Link>
              <Link href="/pages/tenant/maintenance/history">
                <button className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View History
                </button>
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Requests" },
                { key: "pending", label: "Pending" },
                { key: "scheduled", label: "Scheduled" },
                { key: "in-progress", label: "In Progress" },
                { key: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs font-semibold">
                    {statusCounts[tab.key as keyof typeof statusCounts]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 font-medium">
                  Loading your requests...
                </span>
              </div>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === "all"
                  ? "No maintenance requests yet"
                  : `No ${filter} requests`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === "all"
                  ? "Create your first maintenance request to get started."
                  : `You don't have any ${filter} maintenance requests at this time.`}
              </p>
              {filter === "all" && (
                <Link
                  href={`/pages/tenant/maintenance/add?agreement_id=${agreement_id}`}
                >
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
                    Create Your First Request
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Desktop/Tablet View */}
            <div className="hidden md:block space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.request_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden"
                >
                  <div className="flex">
                    {/* Image Section */}
                    <div className="w-48 lg:w-56 h-40 flex-shrink-0">
                      {request.photos?.[0] ? (
                        <img
                          src={request.photos[0]}
                          alt="Maintenance issue"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <svg
                              className="w-12 h-12 text-gray-400 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-sm text-gray-500">
                              No Image
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 pr-4">
                          {request.subject}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusStyle(
                            request.status
                          )}`}
                        >
                          <span>{getStatusIcon(request.status)}</span>
                          {request.status}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {request.description}
                      </p>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🏠</span>
                          <div>
                            <span className="text-gray-500">Property:</span>
                            <span className="font-medium text-gray-900 ml-1">
                              {request.property_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🚪</span>
                          <div>
                            <span className="text-gray-500">Unit:</span>
                            <span className="font-medium text-gray-900 ml-1">
                              {request.unit_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span>{getCategoryIcon(request.category)}</span>
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="font-medium text-gray-900 ml-1">
                              {request.category}
                            </span>
                          </div>
                        </div>

                        {request.created_at && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">📅</span>
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <span className="font-medium text-gray-900 ml-1">
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.request_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 pr-2 flex-1">
                      {request.subject}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                        request.status
                      )}`}
                    >
                      <span className="text-xs">
                        {getStatusIcon(request.status)}
                      </span>
                      {request.status}
                    </span>
                  </div>

                  {/* Image */}
                  {request.photos?.[0] && (
                    <div className="mb-4">
                      <img
                        src={request.photos[0]}
                        alt="Maintenance issue"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {request.description}
                  </p>

                  {/* Details Grid */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 flex items-center gap-2">
                        <span>🏠</span> Property
                      </span>
                      <span className="font-medium text-gray-900">
                        {request.property_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 flex items-center gap-2">
                        <span>🚪</span> Unit
                      </span>
                      <span className="font-medium text-gray-900">
                        {request.unit_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 flex items-center gap-2">
                        <span>{getCategoryIcon(request.category)}</span>{" "}
                        Category
                      </span>
                      <span className="font-medium text-gray-900">
                        {request.category}
                      </span>
                    </div>

                    {request.created_at && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-gray-500 flex items-center gap-2">
                          <span>📅</span> Created
                        </span>
                        <span className="font-medium text-gray-900">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && maintenanceRequests.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Total",
                  count: statusCounts.all,
                  color: "text-gray-600",
                },
                {
                  label: "Pending",
                  count: statusCounts.pending,
                  color: "text-yellow-600",
                },
                {
                  label: "In Progress",
                  count: statusCounts["in-progress"],
                  color: "text-purple-600",
                },
                {
                  label: "Completed",
                  count: statusCounts.completed,
                  color: "text-green-600",
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.count}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
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
