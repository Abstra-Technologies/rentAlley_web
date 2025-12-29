"use client";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
    Calendar,
    Clock,
    User,
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
import { IMPORTANT_DATES } from "@/constant/calendar/importantDates";

/* =====================================================
   PAGE
===================================================== */
const BookingAppointment = () => {
    const { fetchSession, user } = useAuthStore();

    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs());

    const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
    const [disapprovalReason, setDisapprovalReason] = useState("");

    const [activeTab, setActiveTab] = useState<"calendar" | "list">("calendar");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    /* =====================================================
       FETCH
    ===================================================== */
    useEffect(() => {
        if (!user) fetchSession();
        if (user?.landlord_id) fetchVisits();
    }, [user]);

    const fetchVisits = async () => {
        try {
            const res = await axios.get(
                `/api/landlord/properties/getAllBookingVisits?landlord_id=${user?.landlord_id}`
            );
            setVisits(res.data || []);
        } catch (err) {
            console.error("Error fetching visits:", err);
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       HELPERS
    ===================================================== */
    const visitsByDate = visits.reduce<Record<string, any[]>>((acc, visit) => {
        const key = dayjs(visit.visit_date).format("YYYY-MM-DD");
        acc[key] = acc[key] || [];
        acc[key].push(visit);
        return acc;
    }, {});

    const statusCounts = visits.reduce<Record<string, number>>((acc, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
    }, {});

    const selectedDateVisits =
        visitsByDate[selectedDate.format("YYYY-MM-DD")] || [];

    const upcomingVisits = visits
        .filter(
            (v) => v.status === "approved" && dayjs(v.visit_date).isAfter(dayjs())
        )
        .sort(
            (a, b) =>
                dayjs(a.visit_date).valueOf() - dayjs(b.visit_date).valueOf()
        )
        .slice(0, 5);

    const filteredVisits = visits.filter((visit) => {
        const matchesSearch =
            `${visit.tenant_first_name} ${visit.tenant_last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            visit.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.unit_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "all" || visit.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    /* =====================================================
       ACTIONS
    ===================================================== */
    const updateStatus = async (
        visit_id: number,
        status: string,
        reason?: string
    ) => {
        await axios.put("/api/landlord/properties/updateBookingStatus", {
            visit_id,
            status,
            reason,
        });

        setVisits((prev) =>
            prev.map((v) =>
                v.visit_id === visit_id
                    ? { ...v, status, disapproval_reason: reason }
                    : v
            )
        );
    };

    /* =====================================================
       UI COMPONENTS
    ===================================================== */
    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            pending: "bg-amber-100 text-amber-700",
            approved: "bg-emerald-100 text-emerald-700",
            disapproved: "bg-orange-100 text-orange-700",
            cancelled: "bg-red-100 text-red-700",
        };

        return (
            <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}
            >
        {status}
      </span>
        );
    };

    const VisitCard = ({ visit, compact = false }: any) => (
        <div className="bg-white border rounded-lg p-4">
            <div className="flex justify-between gap-3">
                <div>
                    <p className="font-medium">
                        {visit.tenant_first_name} {visit.tenant_last_name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {visit.property_name} • {visit.unit_name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {dayjs(visit.visit_date).format("MMM D")} • {visit.visit_time}
                    </p>

                    {visit.disapproval_reason && (
                        <p className="text-xs text-orange-600 mt-2">
                            Reason: {visit.disapproval_reason}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={visit.status} />

                    {visit.status === "pending" && !compact && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => updateStatus(visit.visit_id, "approved")}
                                className="p-1.5 bg-emerald-50 rounded"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedVisitId(visit.visit_id);
                                    setShowDisapprovalModal(true);
                                }}
                                className="p-1.5 bg-red-50 rounded"
                            >
                                <XCircle className="w-4 h-4 text-red-600" />
                            </button>
                        </div>
                    )}

                    {visit.status === "approved" && !compact && (
                        <button
                            onClick={() => {
                                setSelectedVisitId(visit.visit_id);
                                setShowCancellationModal(true);
                            }}
                            className="p-1.5 bg-gray-50 rounded"
                        >
                            <CalendarX className="w-4 h-4 text-gray-600" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    /* =====================================================
       CALENDAR VIEW (LIMIT LOGIC REMOVED)
    ===================================================== */
    const CalendarView = () => {
        const start = currentMonth.startOf("month").startOf("week");
        const end = currentMonth.endOf("month").endOf("week");

        const days = [];
        let d = start;

        while (d.isBefore(end) || d.isSame(end, "day")) {
            days.push(d);
            d = d.add(1, "day");
        }

        return (
            <div className="bg-white border rounded-lg">
                <div className="flex items-center justify-between p-4 border-b">
                    <button onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}>
                        <ChevronLeft />
                    </button>
                    <h2 className="font-semibold">
                        {currentMonth.format("MMMM YYYY")}
                    </h2>
                    <button onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}>
                        <ChevronRight />
                    </button>
                </div>

                <div className="grid grid-cols-7 p-2 text-xs text-center text-gray-500">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 p-2">
                    {days.map((date) => {
                        const key = date.format("YYYY-MM-DD");
                        const dayVisits = visitsByDate[key] || [];

                        return (
                            <div
                                key={key}
                                onClick={() => setSelectedDate(date)}
                                className={`p-2 border rounded-lg cursor-pointer ${
                                    date.isSame(selectedDate, "day")
                                        ? "bg-blue-50 border-blue-400"
                                        : ""
                                }`}
                            >
                                <span className="text-sm">{date.date()}</span>

                                {dayVisits.length > 0 && (
                                    <div className="mt-1 text-xs text-blue-600">
                                        {dayVisits.length} visit(s)
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* =====================================================
       RENDER
    ===================================================== */
    if (loading) return <div className="p-6">Loading…</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">My Calendar</h1>
                <p className="text-sm text-gray-600">
                    Manage property visit requests
                </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Stat icon={Clock} label="Pending" value={statusCounts.pending || 0} />
                <Stat
                    icon={CheckCircle2}
                    label="Approved"
                    value={statusCounts.approved || 0}
                />
                <Stat
                    icon={AlertCircle}
                    label="Declined"
                    value={statusCounts.disapproved || 0}
                />
                <Stat
                    icon={CalendarDays}
                    label="Today"
                    value={
                        visitsByDate[dayjs().format("YYYY-MM-DD")]?.length || 0
                    }
                />
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-5 bg-white p-1 rounded border">
                {["calendar", "list"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2 rounded ${
                            activeTab === tab
                                ? "bg-blue-600 text-white"
                                : "text-gray-600"
                        }`}
                    >
                        {tab === "calendar" ? "Calendar View" : "List View"}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* MAIN */}
                <div className="lg:col-span-2">
                    {activeTab === "calendar" && <CalendarView />}

                    {activeTab === "calendar" && (
                        <div className="bg-white border rounded-lg mt-6">
                            <div className="p-4 border-b font-semibold">
                                {selectedDate.format("MMMM D, YYYY")}
                            </div>
                            <div className="p-4 space-y-3">
                                {selectedDateVisits.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center">
                                        No visits scheduled
                                    </p>
                                ) : (
                                    selectedDateVisits.map((v) => (
                                        <VisitCard key={v.visit_id} visit={v} />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "list" && (
                        <div className="bg-white border rounded-lg">
                            <div className="p-4 flex gap-2 border-b">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        className="w-full pl-9 py-2 border rounded"
                                        placeholder="Search visits..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border rounded px-2"
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="disapproved">Declined</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredVisits.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center">
                                        No visits found
                                    </p>
                                ) : (
                                    filteredVisits.map((v) => (
                                        <VisitCard key={v.visit_id} visit={v} />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR (AVAILABLE DATES REMOVED) */}
                <div className="space-y-6">
                    <SidebarBlock
                        title="Pending Requests"
                        icon={Clock}
                        data={visits.filter((v) => v.status === "pending")}
                    />
                    <SidebarBlock
                        title="Upcoming Visits"
                        icon={UserCheck}
                        data={upcomingVisits}
                    />
                    {/*<div className="bg-white border rounded-lg">*/}
                    {/*    <div className="p-4 border-b font-semibold flex gap-2">*/}
                    {/*        <Info className="w-4 h-4 text-blue-500" />*/}
                    {/*        Important Dates*/}
                    {/*    </div>*/}
                    {/*    <div className="p-4 space-y-2">*/}
                    {/*        {IMPORTANT_DATES.slice(0, 5).map((e) => (*/}
                    {/*            <div key={e.date}>*/}
                    {/*                <p className="text-sm font-medium">{e.title}</p>*/}
                    {/*                <p className="text-xs text-gray-500">*/}
                    {/*                    {dayjs(e.date).format("MMM D, YYYY")}*/}
                    {/*                </p>*/}
                    {/*            </div>*/}
                    {/*        ))}*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
            </div>

            {/* MODALS */}
            {showDisapprovalModal && (
                <Modal
                    title="Decline Visit"
                    onClose={() => setShowDisapprovalModal(false)}
                    onConfirm={() => {
                        updateStatus(selectedVisitId!, "disapproved", disapprovalReason);
                        setShowDisapprovalModal(false);
                        setDisapprovalReason("");
                    }}
                >
          <textarea
              className="w-full border rounded p-2"
              placeholder="Reason"
              value={disapprovalReason}
              onChange={(e) => setDisapprovalReason(e.target.value)}
          />
                </Modal>
            )}

            {showCancellationModal && (
                <Modal
                    title="Cancel Visit"
                    onClose={() => setShowCancellationModal(false)}
                    onConfirm={() => {
                        updateStatus(selectedVisitId!, "cancelled");
                        setShowCancellationModal(false);
                    }}
                >
                    <p>Are you sure you want to cancel this visit?</p>
                </Modal>
            )}
        </div>
    );
};

/* =====================================================
   SMALL COMPONENTS
===================================================== */
const Stat = ({ icon: Icon, label, value }: any) => (
    <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-center mb-1">
            <Icon className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold">{value}</span>
        </div>
        <p className="text-sm text-gray-600">{label}</p>
    </div>
);

const SidebarBlock = ({ title, icon: Icon, data }: any) => (
    <div className="bg-white border rounded-lg">
        <div className="p-4 border-b font-semibold flex gap-2">
            <Icon className="w-4 h-4 text-blue-500" />
            {title}
        </div>
        <div className="p-4 space-y-3">
            {data.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">None</p>
            ) : (
                data.slice(0, 3).map((v: any) => (
                    <div key={v.visit_id} className="text-sm">
                        {v.tenant_first_name} {v.tenant_last_name}
                    </div>
                ))
            )}
        </div>
    </div>
);

const Modal = ({ title, children, onClose, onConfirm }: any) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="font-semibold mb-4">{title}</h2>
            {children}
            <div className="flex gap-2 mt-4">
                <button onClick={onClose} className="flex-1 border rounded py-2">
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 bg-blue-600 text-white rounded py-2"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
);

export default BookingAppointment;
