
"use client";

import React, { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_STATUS } from "@/constant/maintenanceStatus";

 import { getStatusConfig, getPriorityConfig } from "@/components/landlord/maintenance_management/getStatusConfig";

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

    // FETCH REQUESTS
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
        newStatus = newStatus?.toLowerCase(); // CASE INSENSITIVE

        const request = requests.find((r) => r.request_id === request_id);
        const isLandlordCreated = !request?.tenant_id; // landlord-created work order

        // -------------------------------
        // 1️⃣ SCHEDULING FLOW
        // -------------------------------
        if (newStatus === "scheduled") {
            setCurrentRequestId(request_id);
            setShowCalendar(true);
            return;
        }

        // -------------------------------
        // 2️⃣ COMPLETION FLOW (WITH OPTIONAL EXPENSE)
        // -------------------------------
        if (newStatus === "completed") {
            // Landlord-created → skip expense popup
            if (isLandlordCreated) {
                try {
                    await axios.put("/api/maintenance/updateStatus", {
                        request_id,
                        status: "completed",
                        completion_date: new Date().toISOString(),
                        landlord_id: landlordId,
                        user_id: user?.user_id,
                    });

                    // Update local state
                    setRequests((prev) =>
                        prev.map((r) =>
                            r.request_id === request_id
                                ? { ...r, status: "completed", completion_date: new Date().toISOString() }
                                : r
                        )
                    );
                } catch (err) {
                    console.error(err);
                }
                return;
            }

            // Tenant-created → show expense modal
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
                                ? { ...r, status: "completed", completion_date: new Date().toISOString() }
                                : r
                        )
                    );
                } catch (err) {
                    console.error(err);
                }
                return;
            }
        }

        // -------------------------------
        // 3️⃣ NORMAL STATUS CHANGES
        // -------------------------------
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
                    r.request_id === request_id ? { ...r, status: newStatus, ...extra } : r
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

    // FILTERS
    const filteredRequests = requests
        .filter((req) => req.subject.toLowerCase().includes(search.toLowerCase()))
        .filter((req) => (filterStatus ? req.status.toLowerCase() === filterStatus.toLowerCase() : true))
        .filter((req) =>
            filterPriority ? req.priority_level?.toLowerCase() === filterPriority.toLowerCase() : true
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
        <div className="min-h-screen bg-gray-50">

            {/* HEADER */}
            <div className="bg-white border-b pt-20 pb-4 px-4 md:pt-6 md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Search className="w-6 h-6 text-white" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
                            <p className="text-gray-600 text-sm">Manage maintenance requests</p>
                        </div>
                    </div>

                    {/* SEARCH + NEW */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>

                        <button
                            onClick={() => setShowNewModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold shadow-md hover:opacity-90"
                        >
                            + New Work Order
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="px-4 md:px-8 lg:px-12 xl:px-16 py-5">

                {/* FILTERS */}
                <div className="flex flex-wrap gap-3 mb-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border rounded-lg bg-white text-sm"
                    >
                        <option value="">All Status</option>
                        {MAINTENANCE_STATUS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
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
                        className={`px-4 py-2 text-sm rounded-lg border ${
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
                        className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700"
                    >
                        Clear
                    </button>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="md:hidden flex flex-col gap-4">
                    {loading && (
                        <div className="text-center text-gray-500 py-4">Loading...</div>
                    )}

                    {!loading && filteredRequests.length === 0 && (
                        <div className="text-center text-gray-500 py-4">No work orders found.</div>
                    )}

                    {filteredRequests.map((req) => {
                        const st = getStatusConfig(req.status);
                        const pr = getPriorityConfig(req.priority_level);

                        return (
                            <div
                                key={req.request_id}
                                onClick={() => {
                                    setSelectedRequest(req);
                                    setShowModal(true);
                                }}
                                className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-blue-700">{req.subject}</h3>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </div>

                                <p className="text-sm text-gray-500 mt-1">ID: #{req.request_id}</p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span
                                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${pr.bg} ${pr.text} ${pr.border}`}
                                    >
                                        ⚡ {pr.label}
                                    </span>

                                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">
                                        {req.category}
                                    </span>
                                </div>

                                <div className="mt-2">
                                    <span
                                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${st.bg} ${st.text} ${st.border}`}
                                    >
                                        {st.label}
                                    </span>
                                </div>

                                {req.schedule_date && (
                                    <div className="text-gray-600 text-sm mt-1">
                                        Scheduled:{" "}
                                        {new Date(req.schedule_date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "numeric",
                                            minute: "numeric",
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block bg-white border rounded-lg shadow-sm overflow-x-auto">
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
                                <td colSpan={8} className="text-center py-10">Loading...</td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-10 text-gray-500">
                                    No work orders found.
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((req) => {
                                const st = getStatusConfig(req.status);
                                const pr = getPriorityConfig(req.priority_level);

                                return (
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

                                        <td className="px-4 py-3">#{req.request_id}</td>

                                        {/* STATUS DROPDOWN (COLORED) */}
                                        <td
                                            onClick={(e) => e.stopPropagation()}
                                            className="px-4 py-3"
                                        >
                                            <select
                                                value={req.status}
                                                onChange={(e) =>
                                                    updateStatus(req.request_id, e.target.value)
                                                }
                                                className={`
                                                    px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer
                                                    ${st.bg} ${st.text} ${st.border}
                                                `}
                                            >
                                                {MAINTENANCE_STATUS.map((s) => {
                                                    const opt = getStatusConfig(s.value);
                                                    return (
                                                        <option
                                                            key={s.value}
                                                            value={s.value}
                                                            className={`${opt.bg} ${opt.text}`}
                                                        >
                                                            {s.label}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </td>

                                        {/* PRIORITY BADGE */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`
                                                    px-2 py-1 rounded-lg text-xs font-semibold border
                                                    ${pr.bg} ${pr.text} ${pr.border}
                                                `}
                                            >
                                                ⚡ {pr.label}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            {req.assigned_to || "Unassigned"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {req.schedule_date
                                                ? new Date(req.schedule_date).toLocaleString()
                                                : "—"}
                                        </td>

                                        <td className="px-4 py-3">{req.category}</td>

                                        <td className="px-4 py-3 text-right">
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS */}
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
                    onComplete={() => updateStatus(selectedRequest.request_id, "completed")}
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
                        setRequests((prev) => [newOrder, ...prev]);
                        setShowNewModal(false);
                    }}
                />
            )}
        </div>
    );
}
