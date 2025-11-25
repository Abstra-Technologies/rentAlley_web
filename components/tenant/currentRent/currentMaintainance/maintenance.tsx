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
        return <ClockIcon className="w-5 h-5" />;
      case "scheduled":
        return <CalendarDaysIcon className="w-5 h-5" />;
      case "in-progress":
        return <WrenchScrewdriverIcon className="w-5 h-5" />;
      case "completed":
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5" />;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="h-full px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex-shrink-0">
                <WrenchScrewdriverIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Maintenance Requests
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Track and manage your property maintenance
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Link
                href={`/pages/tenant/rentalPortal/${agreement_id}/maintenance/add`}
              >
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all text-sm">
                  <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Request
                </button>
              </Link>
              <Link
                href={`/pages/tenant/maintenance/history?agreement_id=${agreement_id}`}
              >
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 rounded-xl font-semibold transition-all shadow-sm text-sm">
                  <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  View History
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 md:p-4 mb-6 md:mb-4">
          <div className="flex items-center gap-2 mb-4 md:mb-3">
            <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Filter by Status
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All", icon: Square3Stack3DIcon },
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
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  filter === tab.key
                    ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-2 border-blue-200 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.key === "in-progress" ? "Progress" : tab.label}
                </span>
                <span
                  className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    filter === tab.key
                      ? "bg-blue-100 text-blue-700"
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
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 md:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Loading your maintenance requests...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 md:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WrenchScrewdriverIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              {filter === "all"
                ? "No Maintenance Requests Yet"
                : `No ${filter.replace("-", " ")} Requests`}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {filter === "all"
                ? "Create your first maintenance request to get started."
                : `You don't have any ${filter.replace(
                    "-",
                    " "
                  )} maintenance requests right now.`}
            </p>
            {filter === "all" && (
              <Link
                href={`/pages/tenant/maintenance/add?agreement_id=${agreement_id}`}
              >
                <button className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all text-sm sm:text-base">
                  <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Request
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request.request_id}
                className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all p-4 md:p-4 lg:p-5"
              >
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
                  {/* Image Section */}
                  <div
                    className="relative w-full lg:w-64 h-48 flex-shrink-0 cursor-zoom-in group"
                    onClick={() => setZoomedImage(request.photos?.[0])}
                  >
                    {request.photos?.[0] ? (
                      <img
                        src={request.photos[0]}
                        alt="Maintenance issue"
                        className="w-full h-full object-cover rounded-xl border-2 border-gray-200 group-hover:opacity-90 transition"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 border-2 border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500">
                        <PhotoIcon className="w-10 h-10 sm:w-12 sm:h-12 mb-2" />
                        <span className="text-xs sm:text-sm font-medium">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                        {request.subject}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold ${getStatusStyle(
                          request.status
                        )} flex-shrink-0 self-start`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {request.description}
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Property
                        </p>
                        <p className="text-xs sm:text-sm text-gray-900 font-semibold break-words">
                          {request.property_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Unit
                        </p>
                        <p className="text-xs sm:text-sm text-gray-900 font-semibold">
                          {request.unit_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Category
                        </p>
                        <p className="text-xs sm:text-sm text-gray-900 font-semibold capitalize">
                          {request.category}
                        </p>
                      </div>
                      {request.created_at && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                            Created
                          </p>
                          <p className="text-xs sm:text-sm text-gray-900 font-semibold">
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Zoom Modal */}
        {zoomedImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setZoomedImage(null)}
          >
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceRequestList;
