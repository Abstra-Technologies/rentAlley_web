"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../../../zustand/authStore";
import Swal from "sweetalert2";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InboxIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const PropertyVisits = () => {
  const { fetchSession, user, admin } = useAuthStore();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPastVisits, setShowPastVisits] = useState(false);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  useEffect(() => {
    if (!user?.tenant_id) return;

    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/property-finder/viewBookings?tenant_id=${user?.tenant_id}`
        );
        setVisits(response.data);
      } catch (error) {
        console.error("Error fetching visits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [user]);

  const handleMarkAttendance = async (visitId, attended) => {
    try {
      await axios.put(
        "/api/tenant/property-finder/viewBookings/markAttendance",
        {
          visit_id: visitId,
          attended: attended,
        }
      );

      setVisits((prevVisits) =>
        prevVisits.map((visit) =>
          visit.visit_id === visitId ? { ...visit, attended: attended } : visit
        )
      );

      Swal.fire({
        title: "Success!",
        text: `Visit marked as ${attended ? "attended" : "no show"}.`,
        icon: "success",
        confirmButtonColor: "#10B981",
        customClass: { popup: "rounded-xl" },
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update attendance. Try again later.",
        icon: "error",
        customClass: { popup: "rounded-xl" },
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusConfig = (status, attended) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          icon: PendingIcon,
          iconColor: "text-amber-600",
          label: "Pending Approval",
        };
      case "approved":
        return {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircleIcon,
          iconColor: "text-emerald-600",
          label: "Confirmed",
        };
      case "cancelled":
        return {
          badge: "bg-gray-50 text-gray-700 border-gray-200",
          icon: XCircleIcon,
          iconColor: "text-gray-600",
          label: "Cancelled",
        };
      case "completed":
        if (attended === true) {
          return {
            badge: "bg-blue-50 text-blue-700 border-blue-200",
            icon: CheckCircleIcon,
            iconColor: "text-blue-600",
            label: "Attended",
          };
        } else if (attended === false) {
          return {
            badge: "bg-rose-50 text-rose-700 border-rose-200",
            icon: XCircleIcon,
            iconColor: "text-rose-600",
            label: "No Show",
          };
        } else {
          return {
            badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
            icon: CheckCircleIcon,
            iconColor: "text-indigo-600",
            label: "Completed",
          };
        }
      default:
        return {
          badge: "bg-gray-50 text-gray-700 border-gray-200",
          icon: ClockIcon,
          iconColor: "text-gray-600",
          label: status,
        };
    }
  };

  const upcomingVisits = visits.filter(
    (visit) => visit.status === "approved" || visit.status === "pending"
  );

  const pastVisits = visits.filter(
    (visit) => visit.status === "completed" || visit.status === "cancelled"
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TenantOutsidePortalNav />

      <div className="flex-1 md:ml-64">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <CalendarDaysIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Property Visits
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    Track your scheduled viewings
                  </p>
                </div>
              </div>

              {/* Stats Badge */}
              {visits.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-100">
                  <SparklesIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {visits.length} {visits.length === 1 ? "visit" : "visits"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
                  <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-500"></div>
                </div>
                <p className="text-gray-600 font-medium">
                  Loading your visits...
                </p>
              </div>
            </div>
          ) : visits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="text-center py-20 px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <InboxIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Property Visits Yet
                </h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  Start exploring properties and book your first visit to find
                  your perfect rental home.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              {upcomingVisits.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarDaysIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {upcomingVisits.length} Upcoming{" "}
                        {upcomingVisits.length === 1 ? "Visit" : "Visits"}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        You have scheduled property viewings
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Visits Section */}
              {upcomingVisits.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Upcoming Visits
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {upcomingVisits.map((visit) => {
                      const statusConfig = getStatusConfig(
                        visit?.status,
                        visit?.attended
                      );
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div
                          key={visit?.visit_id}
                          className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                          <div className="p-5 sm:p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                  {visit?.property_name}
                                </h3>
                                <p className="text-sm text-gray-600 font-medium">
                                  {visit?.unit_name}
                                </p>
                              </div>
                              <div
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusConfig.badge} flex-shrink-0 ml-4`}
                              >
                                <StatusIcon
                                  className={`w-4 h-4 ${statusConfig.iconColor}`}
                                />
                                <span className="text-xs font-semibold">
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>

                            {/* Visit Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                              <div className="flex items-center gap-2.5 text-gray-700">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">
                                    Visit Date
                                  </p>
                                  <p className="text-sm font-bold">
                                    {formatDate(visit?.visit_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 text-gray-700">
                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <ClockIcon className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">
                                    Time
                                  </p>
                                  <p className="text-sm font-bold">
                                    {formatTime(visit?.visit_time)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Disapproval Reason */}
                            {visit?.disapproval_reason && (
                              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-2">
                                  <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-semibold text-amber-900">
                                      Note from Landlord
                                    </p>
                                    <p className="text-sm text-amber-800 mt-1">
                                      {visit?.disapproval_reason}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {visit?.status === "completed" &&
                              visit?.attended === undefined && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                                  <button
                                    onClick={() =>
                                      handleMarkAttendance(
                                        visit?.visit_id,
                                        true
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Mark as Attended
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleMarkAttendance(
                                        visit?.visit_id,
                                        false
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-bold text-sm transition-all duration-300"
                                  >
                                    <XCircleIcon className="w-4 h-4" />
                                    Mark as No Show
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Visits Section */}
              {pastVisits.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPastVisits(!showPastVisits)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/80 hover:border-gray-300 transition-all duration-300 mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Past Visits ({pastVisits.length})
                      </h2>
                    </div>
                    {showPastVisits ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {showPastVisits && (
                    <div className="space-y-3">
                      {pastVisits.map((visit) => {
                        const statusConfig = getStatusConfig(
                          visit?.status,
                          visit?.attended
                        );
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div
                            key={visit?.visit_id}
                            className="bg-white rounded-xl border border-gray-200/80 p-4 hover:shadow-sm transition-all duration-300"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 mb-1">
                                  {visit?.property_name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {visit?.unit_name}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                                    {formatDate(visit?.visit_date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    {formatTime(visit?.visit_time)}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${statusConfig.badge} flex-shrink-0`}
                              >
                                <StatusIcon
                                  className={`w-3.5 h-3.5 ${statusConfig.iconColor}`}
                                />
                                <span className="text-xs font-semibold">
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyVisits;
