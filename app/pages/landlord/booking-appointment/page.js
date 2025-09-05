"use client";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Home,
  User,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import axios from "axios";
import useAuthStore from "../../../../zustand/authStore";
import LoadingScreen from "../../../../components/loadingScreen";

const BookingAppointment = () => {
  const { fetchSession, user, admin } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [disapprovalReason, setDisapprovalReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

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

  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

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

  const VisitCard = ({ visit, showActions = false }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <p className="font-semibold text-gray-800">
              {visit.tenant_first_name} {visit.tenant_last_name}
            </p>
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-gray-400" />
            {visit.property_name} • {visit.unit_name}
          </p>
          <p className="text-sm font-medium text-indigo-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatVisitDate(visit.visit_date).format("MMM D, YYYY")} at{" "}
            {visit.visit_time}
          </p>
        </div>

        {visit.status === "approved" && (
          <button
            onClick={() => handleCancelVisit(visit.visit_id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
            title="Cancel Visit"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {showActions && visit.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => approveVisit(visit.visit_id)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm shadow-sm"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => handleDisapprove(visit.visit_id)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 font-medium text-sm shadow-sm"
          >
            ✗ Decline
          </button>
        </div>
      )}
    </div>
  );

  const StatusSection = ({ title, icon, visits, color, emptyMessage }) => (
    <div className="mb-6">
      <div
        className={`flex items-center gap-3 mb-4 p-3 bg-gradient-to-r ${color} rounded-xl`}
      >
        {icon}
        <h3 className="font-bold text-white text-base">
          {title} ({visits.length})
        </h3>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            {icon}
          </div>
          <p className="text-gray-500 italic">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {visits.map((visit) => (
            <VisitCard
              key={visit.visit_id}
              visit={visit}
              showActions={visit.status === "pending"}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
        <LoadingScreen message="Fetching your bookings, please wait..." />
      </div>
    );
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-gray-800">
              Booking Calendar
            </h1>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {showSidebar ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="px-4 pb-3">
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                <Clock className="w-3 h-3" />
                {statusCounts.pending || 0} Pending
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full">
                <CheckCircle className="w-3 h-3" />
                {statusCounts.approved || 0} Approved
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row min-h-screen">
          <div
            className={` 
      fixed lg:relative left-0 top-20 bottom-0 z-40 w-full sm:w-96 lg:w-1/3 xl:w-1/4 
      bg-white transform transition-transform duration-300 ease-in-out
      ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      lg:transform-none lg:top-0 lg:inset-y-0 border-r border-gray-200
    `}
          >
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                <div className="lg:hidden mb-4">
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <StatusSection
                  title="Pending Approval"
                  icon={<Clock className="w-5 h-5 text-white" />}
                  visits={visits.filter((v) => v.status === "pending")}
                  color="from-amber-500 to-orange-600"
                  emptyMessage="No pending requests"
                />

                <StatusSection
                  title="Upcoming Visits"
                  icon={<CheckCircle className="w-5 h-5 text-white" />}
                  visits={visits.filter((v) => v.status === "approved")}
                  color="from-emerald-500 to-green-600"
                  emptyMessage="No upcoming visits"
                />

                <StatusSection
                  title="Cancelled Visits"
                  icon={<XCircle className="w-5 h-5 text-white" />}
                  visits={visits.filter((v) => v.status === "cancelled")}
                  color="from-red-500 to-rose-600"
                  emptyMessage="No cancelled visits"
                />

                <StatusSection
                  title="Declined Visits"
                  icon={<AlertTriangle className="w-5 h-5 text-white" />}
                  visits={visits.filter((v) => v.status === "disapproved")}
                  color="from-orange-500 to-amber-600"
                  emptyMessage="No declined visits"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 lg:p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <button
                    onClick={prevMonth}
                    className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl lg:text-2xl font-bold text-white">
                    {currentMonth.format("MMMM YYYY")}
                  </h2>
                  <button
                    onClick={nextMonth}
                    className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 lg:p-6">
                <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center font-semibold text-gray-600 py-2 text-sm lg:text-base"
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day[0]}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7 gap-1 lg:gap-2">
                  {Array.from({
                    length: (currentMonth.startOf("month").day() || 7) - 1,
                  }).map((_, i) => (
                    <div
                      key={`empty-start-${i}`}
                      className="h-16 lg:h-24"
                    ></div>
                  ))}

                  {Array.from({ length: currentMonth.daysInMonth() }).map(
                    (_, i) => {
                      const date = currentMonth.date(i + 1);
                      const dateKey = date.format("YYYY-MM-DD");
                      const dayVisits = visitsByDate[dateKey] || [];
                      const hasApprovedVisit = dayVisits.some(
                        (v) => v.status === "approved"
                      );
                      const hasPendingVisit = dayVisits.some(
                        (v) => v.status === "pending"
                      );

                      const isToday =
                        date.format("YYYY-MM-DD") ===
                        dayjs().format("YYYY-MM-DD");
                      const isSelected =
                        date.format("YYYY-MM-DD") === selectedDate;

                      return (
                        <div
                          key={i}
                          onClick={() =>
                            setSelectedDate(date.format("YYYY-MM-DD"))
                          }
                          className={`
                          relative h-16 lg:h-24 border-2 rounded-xl cursor-pointer transition-all duration-200 p-2
                          hover:shadow-md hover:scale-105
                          ${
                            hasApprovedVisit
                              ? "bg-green-50 border-green-200 hover:bg-green-100"
                              : hasPendingVisit
                              ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }
                          ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                          ${
                            isSelected
                              ? "ring-2 ring-indigo-500 ring-offset-2 shadow-lg"
                              : ""
                          }
                        `}
                        >
                          <div className="flex justify-between items-start h-full">
                            <span
                              className={`
                            font-bold text-lg lg:text-xl
                            ${isToday ? "text-blue-600" : "text-gray-700"}
                          `}
                            >
                              {date.date()}
                            </span>

                            {dayVisits.length > 0 && (
                              <div
                                className={`
                              w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                              ${
                                hasApprovedVisit
                                  ? "bg-green-500"
                                  : hasPendingVisit
                                  ? "bg-amber-500"
                                  : "bg-gray-400"
                              }
                            `}
                              >
                                {dayVisits.length}
                              </div>
                            )}
                          </div>

                          {dayVisits.length > 0 && (
                            <div className="hidden lg:block absolute bottom-1 left-1 right-1">
                              <div className="flex gap-1 flex-wrap">
                                {dayVisits.slice(0, 3).map((visit) => (
                                  <div
                                    key={visit.visit_id}
                                    className={`
                                    w-2 h-2 rounded-full
                                    ${
                                      visit.status === "approved"
                                        ? "bg-green-400"
                                        : visit.status === "pending"
                                        ? "bg-amber-400"
                                        : "bg-red-400"
                                    }
                                  `}
                                  />
                                ))}
                                {dayVisits.length > 3 && (
                                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}

                  {Array.from({
                    length:
                      7 -
                      (((currentMonth.startOf("month").day() || 7) -
                        1 +
                        currentMonth.daysInMonth()) %
                        7),
                  }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="h-16 lg:h-24"></div>
                  ))}
                </div>
              </div>
            </div>

            {selectedDate && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 px-6 py-4 border-b">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    {dayjs(selectedDate).format("MMMM D, YYYY")}
                  </h3>
                </div>

                <div className="p-6">
                  {visitsByDate[selectedDate] &&
                  visitsByDate[selectedDate].length > 0 ? (
                    <div className="space-y-4">
                      {visitsByDate[selectedDate].map((visit) => (
                        <div
                          key={visit.visit_id}
                          className={`
                            p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md
                            ${
                              visit.status === "approved"
                                ? "bg-green-50 border-green-500"
                                : visit.status === "pending"
                                ? "bg-amber-50 border-amber-500"
                                : visit.status === "disapproved"
                                ? "bg-orange-50 border-orange-500"
                                : "bg-red-50 border-red-500"
                            }
                          `}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <p className="font-semibold text-gray-800 text-lg">
                                  {visit.tenant_first_name}{" "}
                                  {visit.tenant_last_name}
                                </p>
                              </div>
                              <p className="text-gray-600 flex items-center gap-2 mb-1">
                                <Home className="w-4 h-4" />
                                {visit.property_name} • {visit.unit_name}
                              </p>
                              <p className="font-semibold text-indigo-600 flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4" />
                                {visit.visit_time}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  Status:
                                </span>
                                <span
                                  className={`
                                  px-3 py-1 rounded-full text-xs font-semibold
                                  ${
                                    visit?.status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : visit?.status === "pending"
                                      ? "bg-amber-100 text-amber-800"
                                      : visit?.status === "disapproved"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                `}
                                >
                                  {visit?.status
                                    ? visit.status.charAt(0).toUpperCase() +
                                      visit.status.slice(1)
                                    : "Loading..."}
                                </span>
                              </div>
                              {visit.disapproval_reason && (
                                <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded-lg">
                                  <strong>Reason:</strong>{" "}
                                  {visit.disapproval_reason}
                                </p>
                              )}
                            </div>

                            {visit.status === "pending" && (
                              <div className="flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-max">
                                <button
                                  onClick={() => approveVisit(visit.visit_id)}
                                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleDisapprove(visit.visit_id)
                                  }
                                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-sm"
                                >
                                  ✗ Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg">
                        No visits scheduled for this date
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {showCancellationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Cancel Visit</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-gray-700">
                    Are you sure you want to cancel this visit? This action
                    cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCancellationModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Keep Visit
                  </button>
                  <button
                    onClick={submitCancellation}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 transition-all duration-200"
                  >
                    Cancel Visit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDisapprovalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  Decline Visit Request
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for declining
                  </label>
                  <textarea
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                    rows="4"
                    value={disapprovalReason}
                    onChange={(e) => setDisapprovalReason(e.target.value)}
                    placeholder="Please provide a reason for declining this visit request..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDisapprovalModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDisapproval}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!disapprovalReason.trim()}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
};

export default BookingAppointment;
