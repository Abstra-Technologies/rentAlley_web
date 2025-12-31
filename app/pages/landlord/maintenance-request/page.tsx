"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Plus, Filter, Wrench, X } from "lucide-react";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_STATUS } from "@/constant/maintenanceStatus";
import {
  getStatusConfig,
  getPriorityConfig,
} from "@/components/landlord/maintenance_management/getStatusConfig";

import MaintenanceCalendarModal from "@/components/landlord/maintenance_management/MaintenanceCalendarModal";
import MaintenanceDetailsModal from "@/components/landlord/maintenance_management/MaintenanceDetailsModal";
import MaintenanceExpenseModal from "@/components/landlord/maintenance_management/MaintenanceExpenseModal";
import NewWorkOrderModal from "@/components/landlord/maintenance_management/NewWorkOrderModal";
import Swal from "sweetalert2";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

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

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterNext7, setFilterNext7] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);

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

  const updateStatus = async (request_id, newStatus, extra = {}) => {
    newStatus = newStatus?.toLowerCase();

    const request = requests.find((r) => r.request_id === request_id);
    const isLandlordCreated = !request?.tenant_id;

    if (newStatus === "scheduled") {
      setCurrentRequestId(request_id);
      setShowCalendar(true);
      return;
    }

    if (newStatus === "completed") {
      if (isLandlordCreated) {
        try {
          await axios.put("/api/maintenance/updateStatus", {
            request_id,
            status: "completed",
            completion_date: new Date().toISOString(),
            landlord_id: landlordId,
            user_id: user?.user_id,
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
        } catch (err) {
          console.error(err);
        }
        return;
      }

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
        try {
          await axios.put("/api/maintenance/updateStatus", {
            request_id,
            status: "completed",
            completion_date: new Date().toISOString(),
            landlord_id: landlordId,
            user_id: user?.user_id,
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
        } catch (err) {
          console.error(err);
        }
        return;
      }
    }

    try {
      await axios.put("/api/maintenance/updateStatus", {
        request_id,
        status: newStatus,
        ...extra,
        landlord_id: landlordId,
        user_id: user?.user_id,
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
            ? { ...r, status: "scheduled", schedule_date: scheduleISO }
            : r
        )
      );
    } catch (err) {
      console.error(err);
    }

    setShowCalendar(false);
    setCurrentRequestId(null);
  };

  const filteredRequests = requests
    .filter((req) => req.subject.toLowerCase().includes(search.toLowerCase()))
    .filter((req) =>
      filterStatus
        ? req.status.toLowerCase() === filterStatus.toLowerCase()
        : true
    )
    .filter((req) =>
      filterPriority
        ? req.priority_level?.toLowerCase() === filterPriority.toLowerCase()
        : true
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

  const hasActiveFilters = filterStatus || filterPriority || filterNext7;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div>
              <div className="h-7 bg-gray-200 rounded w-32 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 md:px-8 pt-5">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
              <p className="text-gray-600 text-sm">
                Manage maintenance requests
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search work orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
              />
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              New Work Order
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
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
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          <button
            onClick={() => setFilterNext7(!filterNext7)}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${
              filterNext7
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-transparent"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next 7 Days
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterStatus("");
                setFilterPriority("");
                setFilterNext7(false);
              }}
              className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 py-5 pb-24">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                No work orders found
              </h3>
              <p className="text-gray-500">
                {hasActiveFilters
                  ? "Try adjusting your filters."
                  : "Create your first work order to get started."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredRequests.map((req) => {
                const st = getStatusConfig(req.status);
                const pr = getPriorityConfig(req.priority_level);

                return (
                  <motion.div
                    key={req.request_id}
                    variants={fadeInUp}
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowModal(true);
                    }}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        {req.subject}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                      ID: #{req.request_id}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${pr.bg} ${pr.text} ${pr.border}`}
                      >
                        ⚡ {pr.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">
                        {req.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${st.bg} ${st.text} ${st.border}`}
                      >
                        {st.label}
                      </span>

                      {req.schedule_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(req.schedule_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">Title</th>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Priority</th>
                <th className="px-6 py-4 text-left">Assigned</th>
                <th className="px-6 py-4 text-left">Scheduled</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-500">
                    <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No work orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const st = getStatusConfig(req.status);
                  const pr = getPriorityConfig(req.priority_level);

                  return (
                    <tr
                      key={req.request_id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowModal(true);
                      }}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {req.subject}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        #{req.request_id}
                      </td>
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="px-6 py-4"
                      >
                        <select
                          value={req.status}
                          onChange={(e) =>
                            updateStatus(req.request_id, e.target.value)
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${st.bg} ${st.text} ${st.border}`}
                        >
                          {MAINTENANCE_STATUS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${pr.bg} ${pr.text} ${pr.border}`}
                        >
                          ⚡ {pr.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {req.assigned_to || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {req.schedule_date
                          ? new Date(req.schedule_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">
                          {req.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCalendar && (
        <MaintenanceCalendarModal
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          handleScheduleConfirm={handleScheduleConfirm}
          onClose={() => setShowCalendar(false)}
        />
      )}

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
            setRequests((prev) => [newOrder, ...prev]);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}
