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

                setRequests(prev =>
                    prev.map(r =>
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

            setRequests(prev =>
                prev.map(r =>
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

            setRequests(prev =>
                prev.map(r =>
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
        .filter(req =>
            req.subject.toLowerCase().includes(search.toLowerCase())
        )
        .filter(req =>
            filterStatus ? req.status === filterStatus : true
        )
        .filter(req =>
            filterPriority ? req.priority_level === filterPriority : true
        )
        .filter(req => {
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
            <div className="min-h-screen bg-gray-50 p-6">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Work Orders"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full md:w-80 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            + New Work Order
                        </button>
                    </div>
                </div>

                {/* FILTER BAR */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border rounded-lg bg-white text-sm"
                    >
                        <option value="">All Status</option>
                        {MAINTENANCE_STATUS.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
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
                            filterNext7 ? "bg-blue-600 text-white" : "bg-white text-gray-700"
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
                                filteredRequests.map(req => (
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
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <select
                                                value={req.status}
                                                onChange={e =>
                                                    updateStatus(req.request_id, e.target.value)
                                                }
                                                className={`
                                                    px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer
                                                    ${
                                                        MAINTENANCE_STATUS.find(
                                                            s => s.value === req.status
                                                        )?.bg
                                                    }
                                                    ${
                                                        MAINTENANCE_STATUS.find(
                                                            s => s.value === req.status
                                                        )?.text
                                                    }
                                                `}
                                            >
                                                {MAINTENANCE_STATUS.map(s => (
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

                        setRequests(prev =>
                            prev.map(r =>
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
        </>
    );
}
