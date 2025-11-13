"use client";

import React, { useEffect, useState, Suspense } from "react";
import {
    Search,
    ChevronDown,
    CircleDot,
    Calendar,
    Clock,
    CheckCircle,
    Wrench,
    User,
} from "lucide-react";

import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import MaintenanceCalendarModal from "@/components/landlord/maintenance_management/MaintenanceCalendarModal";
import MaintenanceDetailsModal from "@/components/landlord/maintenance_management/MaintenanceDetailsModal";

const MaintenanceRequestPage = () => {
    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentRequestId, setCurrentRequestId] = useState(null);

    const [search, setSearch] = useState("");

    // 🔄 Fetch Requests
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

    // 🔄 Update Status
    const updateStatus = async (request_id, newStatus, extra = {}) => {
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
                    r.request_id === request_id ? { ...r, status: newStatus, ...extra } : r
                )
            );
        } catch (err) {
            console.error(err);
        }
    };

    // 📅 Handle Scheduling
    const handleStartClick = (id) => {
        setCurrentRequestId(id);
        setShowCalendar(true);
    };

    const handleScheduleConfirm = () => {
        if (!currentRequestId) return;

        updateStatus(currentRequestId, "scheduled", {
            schedule_date: selectedDate.toISOString(),
        });

        setShowCalendar(false);
        setCurrentRequestId(null);
    };

    // 🔍 Filtered list
    const filteredRequests = requests.filter((req) =>
        req.subject.toLowerCase().includes(search.toLowerCase())
    );

    // 🟢 Status Badge Colors
    const statusStyles = {
        pending: "bg-amber-100 text-amber-700",
        approved: "bg-blue-100 text-blue-700",
        scheduled: "bg-cyan-100 text-cyan-700",
        "in-progress": "bg-purple-100 text-purple-700",
        completed: "bg-emerald-100 text-emerald-700",
    };

    return (
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
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full md:w-80 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + New Work Order
                    </button>
                </div>
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
                            <th className="px-4 py-3 text-left">Assigned To</th>
                            <th className="px-4 py-3 text-left">Category</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">
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

                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                statusStyles[req.status.toLowerCase()]
                                            }`}
                                        >
                                            {req.status.replace("-", " ")}
                                        </span>
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

            {/* Calendar Modal */}
            {showCalendar && (
                <MaintenanceCalendarModal
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    handleScheduleConfirm={handleScheduleConfirm}
                    onClose={() => setShowCalendar(false)}
                />
            )}

            {/* Request Details Modal */}
            {showModal && selectedRequest && (
                <MaintenanceDetailsModal
                    selectedRequest={selectedRequest}
                    onClose={() => setShowModal(false)}
                    onStart={() => handleStartClick(selectedRequest.request_id)}
                    onComplete={() =>
                        updateStatus(selectedRequest.request_id, "completed", {
                            completion_date: new Date().toISOString(),
                        })
                    }
                    onReschedule={() => handleStartClick(selectedRequest.request_id)}
                    updateStatus={updateStatus}
                />
            )}
        </div>
    );
};

export default MaintenanceRequestPage;
