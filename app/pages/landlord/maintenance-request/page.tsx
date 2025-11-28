"use client";

import React, { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_STATUS } from "@/constant/maintenanceStatus";

import MaintenanceCalendarModal from "@/components/landlord/maintenance_management/MaintenanceCalendarModal";
import MaintenanceDetailsModal from "@/components/landlord/maintenance_management/MaintenanceDetailsModal";
import MaintenanceExpenseModal from "@/components/landlord/maintenance_management/MaintenanceExpenseModal";
import NewWorkOrderModal from "@/components/landlord/maintenance_management/NewWorkOrderModal";

export default function MaintenanceRequestPage() {
  const { user } = useAuthStore();
  const landlordId = user?.landlord_id;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentRequestId, setCurrentRequestId] = useState(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseFor, setExpenseFor] = useState(null);

  // FILTERS
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterNext7, setFilterNext7] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);

  // FETCH MAINTENANCE REQUESTS
  useEffect(() => {
    if (!landlordId) return;

    const fetchRequests = async () => {
      try {
        const res = await axios.get(
          `/api/maintenance/getAllMaintenance?landlord_id=${landlordId}`
        );
        if (res.data.success) setRequests(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [landlordId]);

  // UPDATE STATUS
  const updateStatus = async (request_id, newStatus, extra = {}) => {
    // 1️⃣ If Scheduled → open calendar modal
    if (newStatus === "scheduled") {
      setCurrentRequestId(request_id);
      setShowCalendar(true);
      return;
    }

    // 2️⃣ If Completed → Ask for expense
    if (newStatus === "completed") {
      const result = await Swal.fire({
        title: "Add Expense?",
        text: "Do you want to record a maintenance expense?",
        icon: "question",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Yes, Add Expense",
        denyButtonText: "No, Complete Only",
        cancelButtonText: "Cancel",
      });

      if (result.isDismissed) return;

      if (result.isConfirmed) {
        setExpenseFor(request_id);
        setShowExpenseModal(true);
        return;
      }

      if (result.isDenied) {
        await axios.put("/api/maintenance/updateStatus", {
          request_id,
          status: "completed",
          completion_date: new Date().toISOString(),
          user_id: user?.user_id,
          landlord_id: landlordId,
        });

        setRequests((prev) =>
          prev.map((r) =>
            r.request_id === request_id
              ? {
                  ...r,
                  status: "completed",
                  completion_date: new Date().toISOString(),
                }
              : r
          )
        );
        return;
      }
    }

    // 3️⃣ Normal update
    try {
      await axios.put("/api/maintenance/updateStatus", {
        request_id,
        status: newStatus,
        ...extra,
        user_id: user?.user_id,
        landlord_id: landlordId,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === request_id
            ? { ...r, status: newStatus, ...extra }
            : r
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // SAVE SCHEDULED DATE
  const handleScheduleConfirm = async () => {
    if (!currentRequestId) return;
    const scheduleISO = selectedDate.toISOString();

    try {
      await axios.put("/api/maintenance/updateStatus", {
        request_id: currentRequestId,
        status: "scheduled",
        schedule_date: scheduleISO,
        user_id: user?.user_id,
        landlord_id: landlordId,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === currentRequestId
            ? {
                ...r,
                status: "scheduled",
                schedule_date: scheduleISO,
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
    }

    setShowCalendar(false);
    setCurrentRequestId(null);
  };

  // FILTERING
  const filteredRequests = requests
    .filter((req) => req.subject.toLowerCase().includes(search.toLowerCase()))
    .filter((req) => (filterStatus ? req.status === filterStatus : true))
    .filter((req) =>
      filterPriority ? req.priority_level === filterPriority : true
    )
    .filter((req) => {
      if (!filterNext7) return true;
      if (!req.schedule_date) return false;

      const today = new Date();
      const next7 = new Date();
      next7.setDate(today.getDate() + 7);

      const schedule = new Date(req.schedule_date);
      return schedule >= today && schedule <= next7;
    });

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Work Orders
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage maintenance requests and work orders
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Work Orders"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                />
              </div>

              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl whitespace-nowrap"
              >
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
                New Work Order
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
          {/* FILTER BAR */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-sm"
            >
              <option value="">All Status</option>
              {MAINTENANCE_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-sm"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            <button
              onClick={() => setFilterNext7(!filterNext7)}
              className={`px-4 py-2 rounded-lg text-sm border transition ${
                filterNext7
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Next 7 Days
            </button>

            <button
              onClick={() => {
                setFilterStatus("");
                setFilterPriority("");
                setFilterNext7(false);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Assigned</th>
                  <th className="px-4 py-3 text-left">Scheduled</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-500">
                      No work orders found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.request_id}
                      className="border-b hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowModal(true);
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-blue-700">
                        • {req.subject}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        #{req.request_id}
                      </td>

                      {/* STATUS DROPDOWN */}
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={req.status}
                          onChange={(e) =>
                            updateStatus(req.request_id, e.target.value)
                          }
                          className={`
                                                    px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer
                                                    ${
                                                      MAINTENANCE_STATUS.find(
                                                        (s) =>
                                                          s.value === req.status
                                                      )?.bg
                                                    }
                                                    ${
                                                      MAINTENANCE_STATUS.find(
                                                        (s) =>
                                                          s.value === req.status
                                                      )?.text
                                                    }
                                                `}
                        >
                          {MAINTENANCE_STATUS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        {req.priority_level ? (
                          <span className="text-red-600 font-semibold">
                            {req.priority_level}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {req.assigned_to || "Unassigned"}
                      </td>

                      {/* SCHEDULED COLUMN */}
                      <td className="px-4 py-3 text-gray-700">
                        {req.schedule_date ? (
                          new Date(req.schedule_date).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {req.category}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CALENDAR MODAL */}
        {showCalendar && (
          <MaintenanceCalendarModal
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            handleScheduleConfirm={handleScheduleConfirm}
            onClose={() => setShowCalendar(false)}
          />
        )}

        {/* DETAILS MODAL */}
        {showModal && selectedRequest && (
          <MaintenanceDetailsModal
            selectedRequest={selectedRequest}
            onClose={() => setShowModal(false)}
            onStart={() => {
              setCurrentRequestId(selectedRequest.request_id);
              setShowCalendar(true);
            }}
            onComplete={() =>
              updateStatus(selectedRequest.request_id, "completed")
            }
            onReschedule={() => {
              setCurrentRequestId(selectedRequest.request_id);
              setShowCalendar(true);
            }}
            updateStatus={updateStatus}
          />
        )}
      </div>

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <MaintenanceExpenseModal
          requestId={expenseFor}
          userId={user?.user_id}
          onClose={() => {
            setShowExpenseModal(false);
            setExpenseFor(null);
          }}
          onSaved={(expense) => {
            setShowExpenseModal(false);

            setRequests((prev) =>
              prev.map((r) =>
                r.request_id === expenseFor
                  ? {
                      ...r,
                      status: "completed",
                      completion_date: new Date().toISOString(),
                      last_expense_amount: expense.amount,
                      last_expense_description: expense.description,
                      last_expense_category: expense.category,
                    }
                  : r
              )
            );

            setExpenseFor(null);
          }}
        />
      )}

      {showNewModal && (
        <NewWorkOrderModal
          landlordId={landlordId}
          onClose={() => setShowNewModal(false)}
          onCreated={(newOrder) => {
            setRequests((prev) => [newOrder, ...prev]); // add to top
            setShowNewModal(false);
          }}
        />
      )}
    </>
  );
}
