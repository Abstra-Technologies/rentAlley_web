"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import {
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
} from "@heroicons/react/24/outline";

interface LeaseHistory {
  agreement_id: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  unit_name: string;
  property_name: string;
}

export default function TenantUnitHistory() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<LeaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "active" | "expired" | "cancelled"
  >("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `/api/tenant/history/unit-history?tenant_id=${user?.tenant_id}`
        );
        const data = await res.json();
        if (res.ok) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Error fetching unit history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.tenant_id) {
      fetchHistory();
    }
  }, [user?.tenant_id]);

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: CheckCircleIcon,
        label: "Active",
        dotColor: "bg-emerald-500",
      },
      expired: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        icon: ClockIcon,
        label: "Expired",
        dotColor: "bg-gray-400",
      },
      cancelled: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircleIcon,
        label: "Cancelled",
        dotColor: "bg-red-500",
      },
    };
    return configs[status as keyof typeof configs] || configs.expired;
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  };

  const filteredHistory =
    filter === "all"
      ? history
      : history.filter((lease) => lease.status === filter);

  const stats = {
    total: history.length,
    active: history.filter((h) => h.status === "active").length,
    expired: history.filter((h) => h.status === "expired").length,
    cancelled: history.filter((h) => h.status === "cancelled").length,
  };

  if (loading) {
    return <LoadingScreen message="Fetching your unit history..." />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Sidebar */}
      <TenantOutsidePortalNav />

      {/* Main Content */}
      <div className="page-content-wrapper">
        {/* Top Navigation Bar */}
        <div className="page-header">
          <div className="page-header-container">
            <div className="page-header-inner">
              <div className="page-header-title-section">
                <div className="page-header-icon">
                  <HomeIcon />
                </div>
                <div>
                  <h1 className="page-header-title">Rental History</h1>
                  <p className="page-header-subtitle">
                    Track your rental agreements
                  </p>
                </div>
              </div>

              {/* Stats Summary - Mobile Hidden, Desktop Visible */}
              {history.length > 0 && (
                <div className="hidden md:flex items-center gap-4">
                  <div className="status-badge status-badge-success">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>{stats.active} Active</span>
                  </div>
                  <div className="status-badge status-badge-neutral">
                    <ClockIcon className="w-4 h-4" />
                    <span>{stats.expired} Expired</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="page-main-content">
          {/* Stats Cards */}
          {history.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              <div className="stat-card stat-card-primary">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-label">Total</p>
                    <p className="stat-card-value">{stats.total}</p>
                  </div>
                  <div className="stat-card-icon-wrapper">
                    <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="stat-card stat-card-success">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-label">Active</p>
                    <p className="stat-card-value">{stats.active}</p>
                  </div>
                  <div className="stat-card-icon-wrapper">
                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-label">Expired</p>
                    <p className="stat-card-value text-gray-700">
                      {stats.expired}
                    </p>
                  </div>
                  <div className="stat-card-icon-wrapper bg-gray-50">
                    <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="stat-card border-red-100 hover:border-red-200">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-label text-red-600">Cancelled</p>
                    <p className="stat-card-value text-red-600">
                      {stats.cancelled}
                    </p>
                  </div>
                  <div className="stat-card-icon-wrapper bg-red-50">
                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          {history.length > 0 && (
            <div className="card card-padding mb-4 sm:mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                    filter === "all"
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                    filter === "active"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Active ({stats.active})
                </button>
                <button
                  onClick={() => setFilter("expired")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                    filter === "expired"
                      ? "bg-gray-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Expired ({stats.expired})
                </button>
                <button
                  onClick={() => setFilter("cancelled")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                    filter === "cancelled"
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  Cancelled ({stats.cancelled})
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {history.length === 0 ? (
            <div className="card-elevated card-padding-lg text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <HomeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                No Rental History Yet
              </h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                Your rental history will appear here once you sign your first
                lease agreement.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="card-elevated card-padding-lg text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                No {filter} leases found
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Try selecting a different filter to view your rental history.
              </p>
            </div>
          ) : (
            /* History Cards */
            <div className="space-y-3 sm:space-y-4">
              {filteredHistory.map((lease) => {
                const statusConfig = getStatusConfig(lease.status);
                const StatusIcon = statusConfig.icon;
                const duration = calculateDuration(
                  lease.start_date,
                  lease.end_date
                );

                return (
                  <div
                    key={lease.agreement_id}
                    className="card hover:border-blue-200 hover:shadow-lg transition-all group"
                  >
                    {/* Status Indicator Bar */}
                    <div
                      className={`h-1 sm:h-1.5 ${
                        lease.status === "active"
                          ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                          : lease.status === "expired"
                          ? "bg-gray-300"
                          : "bg-red-400"
                      }`}
                    />

                    <div className="p-4 sm:p-5 md:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                        {/* Left Section - Property Info */}
                        <div className="flex-1 space-y-2 sm:space-y-3">
                          {/* Property Name & Status */}
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                                <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">
                                  {lease.property_name}
                                </h3>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                                    Unit
                                  </span>
                                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-bold">
                                    {lease.unit_name}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div
                              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} flex-shrink-0`}
                            >
                              <span
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
                              />
                              <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="font-bold text-xs sm:text-sm">
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>

                          {/* Date Range & Duration */}
                          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 md:gap-4 pl-9 sm:pl-14">
                            {/* Start Date */}
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 font-medium">
                                Started:
                              </span>
                              <span className="font-semibold text-gray-900">
                                {lease.start_date
                                  ? new Date(
                                      lease.start_date
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </div>

                            <span className="text-gray-300 hidden sm:inline">
                              →
                            </span>

                            {/* End Date */}
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 font-medium">
                                {lease.status === "active" ? "Ends:" : "Ended:"}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {lease.end_date
                                  ? new Date(lease.end_date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )
                                  : "-"}
                              </span>
                            </div>

                            {/* Duration */}
                            {lease.start_date && lease.end_date && (
                              <>
                                <span className="text-gray-300 hidden sm:inline">
                                  •
                                </span>
                                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-50 rounded-full">
                                  <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                  <span className="text-xs sm:text-sm font-bold text-blue-700">
                                    {duration}{" "}
                                    {duration === 1 ? "month" : "months"}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Results Count */}
          {filteredHistory.length > 0 && (
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {filteredHistory.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-900">
                  {history.length}
                </span>{" "}
                {history.length === 1 ? "lease" : "leases"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
