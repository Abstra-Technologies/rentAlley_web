"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Wrench,
  X,
  Filter,
  Calendar,
  Home,
  MoreHorizontal,
} from "lucide-react";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
import {
  getStatusConfig,
  getPriorityConfig,
} from "@/components/landlord/maintenance_management/getStatusConfig";

import MaintenanceCalendarModal from "@/components/landlord/maintenance_management/MaintenanceCalendarModal";
import MaintenanceDetailsModal from "@/components/landlord/maintenance_management/MaintenanceDetailsModal";
import MaintenanceExpenseModal from "@/components/landlord/maintenance_management/MaintenanceExpenseModal";
import NewWorkOrderModal from "@/components/landlord/maintenance_management/NewWorkOrderModal";
import Swal from "sweetalert2";

// ============================================
// TYPES
// ============================================
interface MaintenanceRequest {
  request_id: number;
  subject: string;
  description?: string;
  status: string;
  priority_level: string;
  category: string;
  assigned_to?: string;
  schedule_date?: string;
  completion_date?: string;
  created_at: string;
  tenant_id?: number;
  tenant_first_name?: string;
  tenant_last_name?: string;
  property_name?: string;
  unit_name?: string;
}

// ============================================
// KANBAN COLUMN CONFIGURATION
// ============================================
const KANBAN_COLUMNS = [
  {
    id: "new",
    title: "New",
    statuses: ["pending", "approved"],
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  {
    id: "scheduled",
    title: "Scheduled",
    statuses: ["scheduled"],
    gradient: "from-purple-500 to-indigo-500",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200",
    dotColor: "bg-purple-500",
  },
  {
    id: "in-progress",
    title: "In Progress",
    statuses: ["in-progress"],
    gradient: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-500",
  },
  {
    id: "completed",
    title: "Resolved",
    statuses: ["completed", "rejected"],
    gradient: "from-emerald-500 to-green-500",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
];

// ============================================
// ANIMATION VARIANTS
// ============================================
const pageTransition = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

const columnVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function MaintenanceRequestPage() {
  const { user } = useAuthStore();
  const landlordId = user?.landlord_id;

  // Data state
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseFor, setExpenseFor] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Mobile column navigation
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ============================================
  // DATA FETCHING
  // ============================================
  useEffect(() => {
    if (!landlordId) return;

    const fetchRequests = async () => {
      try {
        const res = await axios.get(
          `/api/maintenance/getAllMaintenance?landlord_id=${landlordId}`,
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

  // ============================================
  // STATUS UPDATE LOGIC
  // ============================================
  const updateStatus = async (
    request_id: number,
    newStatus: string,
    extra = {},
  ) => {
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
                : r,
            ),
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
                : r,
            ),
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
            : r,
        ),
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
            : r,
        ),
      );
    } catch (err) {
      console.error(err);
    }

    setShowCalendar(false);
    setCurrentRequestId(null);
  };

  // ============================================
  // FILTERING
  // ============================================
  const filteredRequests = requests
    .filter((req) => req.subject.toLowerCase().includes(search.toLowerCase()))
    .filter((req) =>
      filterPriority
        ? req.priority_level?.toLowerCase() === filterPriority.toLowerCase()
        : true,
    );

  const getColumnRequests = (column: (typeof KANBAN_COLUMNS)[0]) => {
    return filteredRequests.filter((req) =>
      column.statuses.includes(req.status?.toLowerCase()),
    );
  };

  const hasActiveFilters = filterPriority || search;

  // ============================================
  // MOBILE COLUMN NAVIGATION
  // ============================================
  const scrollToColumn = (index: number) => {
    setActiveColumnIndex(index);
    if (scrollContainerRef.current) {
      const columnWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: columnWidth * index,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const columnWidth = scrollContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / columnWidth);
      if (newIndex !== activeColumnIndex) {
        setActiveColumnIndex(newIndex);
      }
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 lg:py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div>
              <div className="h-5 lg:h-7 bg-gray-200 rounded-lg w-32 lg:w-40 animate-pulse mb-1.5" />
              <div className="h-3 lg:h-4 bg-gray-200 rounded-lg w-24 lg:w-32 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Kanban Skeleton */}
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          {/* Mobile: Single column skeleton */}
          <div className="lg:hidden space-y-3">
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-28 bg-gray-200 rounded-xl animate-pulse"
                style={{ animationDelay: `${j * 100}ms` }}
              />
            ))}
          </div>

          {/* Desktop: Grid skeleton */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-32 bg-gray-200 rounded-xl animate-pulse"
                    style={{ animationDelay: `${j * 100}ms` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30"
    >
      {/* ==================== HEADER ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 lg:py-5 sticky top-14 lg:top-0 z-30"
      >
        {/* Title Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <Wrench className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">
                Work Orders
              </h1>
              <p className="text-gray-500 text-xs lg:text-sm">
                {filteredRequests.length} total requests
              </p>
            </div>
          </div>

          {/* Desktop: New Work Order Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewModal(true)}
            className="hidden sm:flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold text-sm lg:text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>New Work Order</span>
          </motion.button>
        </div>

        {/* Search & Filter Row */}
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">
              Filters
            </span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-100">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilterPriority("");
                    }}
                    className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ==================== MOBILE COLUMN TABS ==================== */}
      <div className="lg:hidden sticky top-[130px] z-20 bg-white border-b border-gray-200 px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {KANBAN_COLUMNS.map((column, index) => {
            const count = getColumnRequests(column).length;
            const isActive = activeColumnIndex === index;

            return (
              <button
                key={column.id}
                onClick={() => scrollToColumn(index)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${
                  isActive
                    ? `bg-gradient-to-r ${column.gradient} text-white`
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-white/80" : column.dotColor
                  }`}
                />
                <span className="font-medium">{column.title}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== KANBAN BOARD ==================== */}
      <div className="px-4 lg:px-8 py-4 lg:py-5 pb-24 lg:pb-8">
        {/* Desktop Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="hidden lg:grid lg:grid-cols-4 gap-5"
        >
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              requests={getColumnRequests(column)}
              onCardClick={(req) => {
                setSelectedRequest(req);
                setShowModal(true);
              }}
              onStatusChange={updateStatus}
            />
          ))}
        </motion.div>

        {/* Mobile Horizontal Scroll */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="lg:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 gap-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {KANBAN_COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-full snap-center"
              style={{ scrollSnapAlign: "start" }}
            >
              <KanbanColumn
                column={column}
                requests={getColumnRequests(column)}
                onCardClick={(req) => {
                  setSelectedRequest(req);
                  setShowModal(true);
                }}
                onStatusChange={updateStatus}
                isMobile
              />
            </div>
          ))}
        </div>

        {/* Mobile Navigation Dots */}
        <div className="lg:hidden flex justify-center gap-1.5 mt-4">
          {KANBAN_COLUMNS.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToColumn(index)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                activeColumnIndex === index
                  ? "bg-blue-500 w-6"
                  : "bg-gray-300 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ==================== MOBILE FAB ==================== */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowNewModal(true)}
        className="sm:hidden fixed bottom-6 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* ==================== MODALS ==================== */}
      <AnimatePresence>
        {showCalendar && (
          <MaintenanceCalendarModal
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            handleScheduleConfirm={handleScheduleConfirm}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
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
                    : r,
                ),
              );
              setExpenseFor(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// KANBAN COLUMN COMPONENT
// ============================================
interface KanbanColumnProps {
  column: (typeof KANBAN_COLUMNS)[0];
  requests: MaintenanceRequest[];
  onCardClick: (req: MaintenanceRequest) => void;
  onStatusChange: (id: number, status: string) => void;
  isMobile?: boolean;
}

function KanbanColumn({
  column,
  requests,
  onCardClick,
  onStatusChange,
  isMobile = false,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <motion.div
      variants={columnVariants}
      className={`flex flex-col ${isMobile ? "min-h-[50vh]" : "h-full"}`}
    >
      {/* Column Header */}
      <div
        className={`flex items-center justify-between p-2.5 lg:p-3 rounded-t-xl bg-gradient-to-r ${column.gradient}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-white/80 rounded-full" />
          <h3 className="font-semibold text-white text-sm">{column.title}</h3>
        </div>
        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-semibold">
          {requests.length}
        </span>
      </div>

      {/* Column Body */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={() => setIsDragOver(false)}
        className={`flex-1 p-2.5 lg:p-3 rounded-b-xl border-2 border-t-0 transition-all duration-200 ${
          isDragOver
            ? `${column.bgLight} ${column.borderColor} border-dashed`
            : "bg-gray-50/50 border-gray-100 border-solid"
        }`}
      >
        <AnimatePresence mode="popLayout">
          {requests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 lg:py-12 text-gray-400"
            >
              <div
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${column.bgLight} flex items-center justify-center mb-2`}
              >
                <Wrench
                  className={`w-5 h-5 lg:w-6 lg:h-6 ${column.dotColor.replace(
                    "bg-",
                    "text-",
                  )}`}
                />
              </div>
              <p className="text-sm font-medium">No requests</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2.5 lg:space-y-3"
            >
              {requests.map((request) => (
                <RequestCard
                  key={request.request_id}
                  request={request}
                  onClick={() => onCardClick(request)}
                  onStatusChange={onStatusChange}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================
// REQUEST CARD COMPONENT
// ============================================
interface RequestCardProps {
  request: MaintenanceRequest;
  onClick: () => void;
  onStatusChange: (id: number, status: string) => void;
}

function RequestCard({ request, onClick, onStatusChange }: RequestCardProps) {
  const priority = getPriorityConfig(request.priority_level);
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      layout
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-3 lg:p-4 cursor-pointer transition-all duration-200 group relative overflow-hidden active:bg-gray-50"
    >
      {/* Priority Indicator Line */}
      <div
        className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${
          request.priority_level?.toLowerCase() === "urgent"
            ? "from-red-500 to-red-600"
            : request.priority_level?.toLowerCase() === "high"
              ? "from-orange-500 to-orange-600"
              : request.priority_level?.toLowerCase() === "medium"
                ? "from-blue-500 to-blue-600"
                : "from-gray-300 to-gray-400"
        }`}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-1.5 pl-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] lg:text-xs text-gray-400 font-medium mb-0.5">
            #{request.request_id}
          </p>
          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {request.subject}
          </h4>
        </div>

        {/* Actions Menu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Property Info */}
      {request.property_name && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 pl-2">
          <Home className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{request.property_name}</span>
          {request.unit_name && (
            <>
              <span className="text-gray-300">•</span>
              <span className="truncate">{request.unit_name}</span>
            </>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2 pl-2">
        {/* Priority Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
        >
          {request.priority_level?.toLowerCase() === "urgent" && (
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          )}
          {priority.label}
        </span>

        {/* Category Badge */}
        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
          {request.category}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 pl-2">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {request.assigned_to ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <span className="text-[9px] lg:text-[10px] font-semibold text-white">
                  {request.assigned_to.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600 truncate max-w-[70px] lg:max-w-[80px]">
                {request.assigned_to}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Unassigned</span>
          )}
        </div>

        {/* Schedule Date */}
        {request.schedule_date && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(request.schedule_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions Dropdown */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-10 right-2 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 min-w-[120px]"
            onClick={(e) => e.stopPropagation()}
          >
            {request.status === "pending" && (
              <>
                <QuickActionButton
                  label="Approve"
                  onClick={() => {
                    onStatusChange(request.request_id, "approved");
                    setShowActions(false);
                  }}
                  color="text-green-600"
                />
                <QuickActionButton
                  label="Reject"
                  onClick={() => {
                    onStatusChange(request.request_id, "rejected");
                    setShowActions(false);
                  }}
                  color="text-red-600"
                />
              </>
            )}
            {request.status === "approved" && (
              <QuickActionButton
                label="Schedule"
                onClick={() => {
                  onStatusChange(request.request_id, "scheduled");
                  setShowActions(false);
                }}
                color="text-purple-600"
              />
            )}
            {request.status === "scheduled" && (
              <QuickActionButton
                label="Start Work"
                onClick={() => {
                  onStatusChange(request.request_id, "in-progress");
                  setShowActions(false);
                }}
                color="text-blue-600"
              />
            )}
            {request.status === "in-progress" && (
              <QuickActionButton
                label="Complete"
                onClick={() => {
                  onStatusChange(request.request_id, "completed");
                  setShowActions(false);
                }}
                color="text-emerald-600"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// QUICK ACTION BUTTON
// ============================================
function QuickActionButton({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 text-left text-sm font-medium ${color} hover:bg-gray-50 transition-colors`}
    >
      {label}
    </button>
  );
}
