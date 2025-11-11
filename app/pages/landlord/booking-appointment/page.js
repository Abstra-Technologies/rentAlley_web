"use client";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Calendar,
  Clock,
  Home,
  User,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MapPin,
  CalendarDays,
  UserCheck,
  CalendarX,
  Info,
} from "lucide-react";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import { IMPORTANT_DATES } from "@/constant/calendar/importantDates";

const BookingAppointment = () => {
  const { fetchSession, user, admin } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [disapprovalReason, setDisapprovalReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [activeTab, setActiveTab] = useState("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Daily booking limit configuration
  const [dailyBookingLimit, setDailyBookingLimit] = useState(5); // Default limit of 5 visits per day
  const [showLimitSettings, setShowLimitSettings] = useState(false);

  useEffect(() => {
    if (user?.landlord_id) {
      fetchVisits();
    }
  }, [user]);

  const fetchVisits = async () => {
    try {
      if (!user?.landlord_id) {
        console.error("Landlord ID is not available");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `/api/landlord/properties/getAllBookingVisits?landlord_id=${user?.landlord_id}`
      );
      setVisits(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching visits:", error);
      setLoading(false);
    }
  };

  const approveVisit = async (visitId) => {
    try {
      await axios.put("/api/landlord/properties/updateBookingStatus", {
        visit_id: visitId,
        status: "approved",
      });

      setVisits(
        visits.map((visit) =>
          visit.visit_id === visitId ? { ...visit, status: "approved" } : visit
        )
      );
    } catch (error) {
      console.error("Error approving visit:", error);
    }
  };

  const handleDisapprove = (visitId) => {
    setSelectedVisitId(visitId);
    setShowDisapprovalModal(true);
  };

  const submitDisapproval = async () => {
    try {
      await axios.put("/api/landlord/properties/updateBookingStatus", {
        visit_id: selectedVisitId,
        status: "disapproved",
        reason: disapprovalReason,
      });

      setVisits(
        visits.map((visit) =>
          visit.visit_id === selectedVisitId
            ? {
                ...visit,
                status: "disapproved",
                disapproval_reason: disapprovalReason,
              }
            : visit
        )
      );

      setShowDisapprovalModal(false);
      setDisapprovalReason("");
      setSelectedVisitId(null);
    } catch (error) {
      console.error("Error disapproving visit:", error);
    }
  };

  const handleCancelVisit = (visitId) => {
    setSelectedVisitId(visitId);
    setShowCancellationModal(true);
  };

  const submitCancellation = async () => {
    try {
      await axios.put("/api/landlord/properties/updateBookingStatus", {
        visit_id: selectedVisitId,
        status: "cancelled",
      });

      setVisits(
        visits.map((visit) =>
          visit.visit_id === selectedVisitId
            ? { ...visit, status: "cancelled" }
            : visit
        )
      );

      setShowCancellationModal(false);
      setCancellationReason("");
      setSelectedVisitId(null);
    } catch (error) {
      console.error("Error cancelling visit:", error);
    }
  };

  const formatVisitDate = (dateString) => {
    return dayjs(dateString.split("T")[0]);
  };

  const visitsByDate = visits.reduce((acc, visit) => {
    const dateKey = formatVisitDate(visit.visit_date).format("YYYY-MM-DD");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(visit);
    return acc;
  }, {});

  const statusCounts = visits.reduce((acc, visit) => {
    acc[visit.status] = (acc[visit.status] || 0) + 1;
    return acc;
  }, {});

  // Check if a date has reached booking limit
  const isDateFullyBooked = (dateKey) => {
    const dayVisits = visitsByDate[dateKey] || [];
    const activeVisits = dayVisits.filter(
      (v) => v.status === "approved" || v.status === "pending"
    );
    return activeVisits.length >= dailyBookingLimit;
  };

  // Get remaining slots for a date
  const getRemainingSlots = (dateKey) => {
    const dayVisits = visitsByDate[dateKey] || [];
    const activeVisits = dayVisits.filter(
      (v) => v.status === "approved" || v.status === "pending"
    );
    return Math.max(0, dailyBookingLimit - activeVisits.length);
  };

  // Get dates with available slots
  const getAvailableDates = () => {
    const availableDates = [];
    const startDate = dayjs();
    const endDate = startDate.add(30, "day"); // Check next 30 days

    let currentDate = startDate;
    while (currentDate.isBefore(endDate)) {
      const dateKey = currentDate.format("YYYY-MM-DD");
      if (!isDateFullyBooked(dateKey)) {
        availableDates.push({
          date: currentDate,
          remainingSlots: getRemainingSlots(dateKey),
        });
      }
      currentDate = currentDate.add(1, "day");
    }

    return availableDates;
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.tenant_first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      visit.tenant_last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      visit.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.unit_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || visit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedDateVisits =
    visitsByDate[selectedDate.format("YYYY-MM-DD")] || [];
  const todaysVisits = visitsByDate[dayjs().format("YYYY-MM-DD")] || [];
  const upcomingVisits = visits
    .filter(
      (v) => v.status === "approved" && dayjs(v.visit_date).isAfter(dayjs())
    )
    .sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date))
    .slice(0, 5);

  const StatusBadge = ({ status }) => {
    const statusStyles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      disapproved: "bg-orange-100 text-orange-700 border-orange-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };

    const statusIcons = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle2 className="w-3 h-3" />,
      disapproved: <AlertCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}
      >
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const VisitCard = ({ visit, compact = false }) => (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {visit.tenant_first_name} {visit.tenant_last_name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {visit.property_name} • {visit.unit_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span>{formatVisitDate(visit.visit_date).format("MMM D")}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{visit.visit_time}</span>
            </div>
          </div>

          {visit.disapproval_reason && (
            <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
              <span className="font-medium">Reason:</span>{" "}
              {visit.disapproval_reason}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={visit.status} />

          {visit.status === "pending" && !compact && (
            <div className="flex gap-1">
              <button
                onClick={() => approveVisit(visit.visit_id)}
                className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                title="Approve"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDisapprove(visit.visit_id)}
                className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                title="Decline"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {visit.status === "approved" && !compact && (
            <button
              onClick={() => handleCancelVisit(visit.visit_id)}
              className="p-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
              title="Cancel"
            >
              <CalendarX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {visit.status === "pending" && compact && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => approveVisit(visit.visit_id)}
            className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handleDisapprove(visit.visit_id)}
            className="flex-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );

  const CalendarView = () => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const calendar = [];
    let day = startDate;

    while (day.isBefore(endDate, "day") || day.isSame(endDate, "day")) {
      calendar.push(day);
      day = day.add(1, "day");
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentMonth.format("MMMM YYYY")}
            </h2>
            <button
              onClick={() => setCurrentMonth(dayjs())}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="p-2 text-center text-sm font-medium text-gray-600"
              >
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendar.map((date, i) => {
              const dateKey = date.format("YYYY-MM-DD");
              const dayVisits = visitsByDate[dateKey] || [];
              const isToday = date.isSame(dayjs(), "day");
              const isSelected = date.isSame(selectedDate, "day");
              const isCurrentMonth = date.isSame(currentMonth, "month");
              const importantEvent = IMPORTANT_DATES.find(
                (event) => event.date === dateKey
              );

              const pendingCount = dayVisits.filter(
                (v) => v.status === "pending"
              ).length;
              const approvedCount = dayVisits.filter(
                (v) => v.status === "approved"
              ).length;
              const activeVisitsCount = pendingCount + approvedCount;
              const remainingSlots = getRemainingSlots(dateKey);
              const isFullyBooked = isDateFullyBooked(dateKey);
              const isPastDate = date.isBefore(dayjs(), "day");

              return (
                <div
                  key={i}
                  onClick={() =>
                    !isFullyBooked && !isPastDate && setSelectedDate(date)
                  }
                  className={`
                    relative min-h-[70px] lg:min-h-[90px] p-2 border rounded-lg transition-all
                    ${
                      !isCurrentMonth
                        ? "bg-gray-50 text-gray-400"
                        : "bg-white text-gray-900"
                    }
                    ${
                      isPastDate
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                        : ""
                    }
                    ${
                      isFullyBooked && !isPastDate
                        ? "bg-red-50 border-red-200 cursor-not-allowed"
                        : ""
                    }
                    ${
                      !isFullyBooked && !isPastDate && isCurrentMonth
                        ? "cursor-pointer hover:bg-blue-50"
                        : ""
                    }
                    ${
                      isToday
                        ? "ring-2 ring-blue-500 ring-offset-1"
                        : "border-gray-200"
                    }
                    ${
                      isSelected && !isFullyBooked
                        ? "bg-blue-50 border-blue-400"
                        : ""
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? "text-blue-600" : ""
                      } ${isFullyBooked ? "text-red-600" : ""}`}
                    >
                      {date.date()}
                    </span>
                    {importantEvent && (
                      <div
                        className={`w-2 h-2 rounded-full ${importantEvent.color}`}
                        title={`${importantEvent.title}`}
                      />
                    )}
                  </div>

                  {/* Show booking availability */}
                  {isCurrentMonth && !isPastDate && (
                    <div className="space-y-1">
                      {isFullyBooked ? (
                        <div className="text-xs font-medium text-red-600">
                          FULL
                        </div>
                      ) : remainingSlots <= 2 && activeVisitsCount > 0 ? (
                        <div className="text-xs text-amber-600 font-medium">
                          {remainingSlots} left
                        </div>
                      ) : null}

                      {dayVisits.length > 0 && (
                        <div className="space-y-0.5">
                          {pendingCount > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-amber-400 rounded-full" />
                              <span className="text-xs text-gray-600">
                                {pendingCount}
                              </span>
                            </div>
                          )}
                          {approvedCount > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                              <span className="text-xs text-gray-600">
                                {approvedCount}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const ListView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, property, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disapproved">Declined</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No visits found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredVisits.map((visit) => (
              <VisitCard key={visit.visit_id} visit={visit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
        <LoadingScreen message="Loading your booking calendar..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              Booking Calendar
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage property visit requests
            </p>
          </div>

          {/* Booking Limit Settings */}
          <button
            onClick={() => setShowLimitSettings(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Daily Limit: {dailyBookingLimit}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-gray-900">
                {statusCounts.pending || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Pending Approval</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold text-gray-900">
                {statusCounts.approved || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Approved</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">
                {statusCounts.disapproved || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Declined</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">
                {todaysVisits.length}
              </span>
            </div>
            <p className="text-sm text-gray-600">Today's Visits</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "calendar"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "list"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            List View
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "calendar" ? <CalendarView /> : <ListView />}

            {/* Selected Date Details (Calendar View Only) */}
            {activeTab === "calendar" && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-500" />
                      {selectedDate.format("MMMM D, YYYY")}
                    </h3>
                    {!selectedDate.isBefore(dayjs(), "day") && (
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isDateFullyBooked(selectedDate.format("YYYY-MM-DD"))
                            ? "bg-red-100 text-red-700"
                            : getRemainingSlots(
                                selectedDate.format("YYYY-MM-DD")
                              ) <= 2
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isDateFullyBooked(selectedDate.format("YYYY-MM-DD"))
                          ? "Fully Booked"
                          : `${getRemainingSlots(
                              selectedDate.format("YYYY-MM-DD")
                            )} slots available`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {selectedDateVisits.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No visits scheduled for this date
                      </p>
                      {!selectedDate.isBefore(dayjs(), "day") &&
                        !isDateFullyBooked(
                          selectedDate.format("YYYY-MM-DD")
                        ) && (
                          <p className="text-sm text-emerald-600 mt-2">
                            {getRemainingSlots(
                              selectedDate.format("YYYY-MM-DD")
                            )}{" "}
                            booking slots available
                          </p>
                        )}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedDateVisits.map((visit) => (
                        <VisitCard key={visit.visit_id} visit={visit} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                    Available Dates
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    Next 30 days
                  </span>
                </h3>
              </div>
              <div className="p-4">
                {getAvailableDates().length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No available dates
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getAvailableDates()
                      .slice(0, 10)
                      .map(({ date, remainingSlots }) => (
                        <div
                          key={date.format("YYYY-MM-DD")}
                          onClick={() => {
                            setSelectedDate(date);
                            setActiveTab("calendar");
                          }}
                          className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {date.format("MMM D, YYYY")}
                              </p>
                              <p className="text-xs text-gray-500">
                                {date.format("dddd")}
                              </p>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                remainingSlots <= 2
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {remainingSlots} slots
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending Requests
                </h3>
              </div>
              <div className="p-4">
                {visits.filter((v) => v.status === "pending").length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No pending requests
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {visits
                      .filter((v) => v.status === "pending")
                      .slice(0, 3)
                      .map((visit) => (
                        <VisitCard key={visit.visit_id} visit={visit} compact />
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Visits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                  Upcoming Visits
                </h3>
              </div>
              <div className="p-4">
                {upcomingVisits.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No upcoming visits
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {upcomingVisits.map((visit) => (
                      <VisitCard key={visit.visit_id} visit={visit} compact />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Important Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Important Dates
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {IMPORTANT_DATES.slice(0, 5).map((event) => (
                    <div
                      key={event.date}
                      className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 ${event.color}`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dayjs(event.date).format("MMM D, YYYY")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancellationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cancel Visit
                  </h2>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this scheduled visit?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancellationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Keep Visit
                </button>
                <button
                  onClick={submitCancellation}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Cancel Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disapproval Modal */}
      {showDisapprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Decline Visit Request
                  </h2>
                  <p className="text-sm text-gray-600">
                    Provide a reason for declining
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for declining
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="4"
                  value={disapprovalReason}
                  onChange={(e) => setDisapprovalReason(e.target.value)}
                  placeholder="Please provide a reason..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisapprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDisapproval}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!disapprovalReason.trim()}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Limit Settings Modal */}
      {showLimitSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Daily Booking Limit
                  </h2>
                  <p className="text-sm text-gray-600">
                    Set maximum visits per day
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum bookings allowed per day
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={dailyBookingLimit}
                  onChange={(e) =>
                    setDailyBookingLimit(parseInt(e.target.value) || 1)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Days with {dailyBookingLimit} or more active bookings will be
                  marked as fully booked
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Current Statistics:
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Days at capacity:</span>
                    <span className="font-medium">
                      {
                        Object.entries(visitsByDate).filter(
                          ([date, visits]) =>
                            visits.filter(
                              (v) =>
                                v.status === "approved" ||
                                v.status === "pending"
                            ).length >= dailyBookingLimit
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available days (next 30):</span>
                    <span className="font-medium">
                      {getAvailableDates().length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLimitSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowLimitSettings(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingAppointment;
