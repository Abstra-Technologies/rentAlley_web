// components/maintenance/statusConfig.js

import {
    Clock,
    CheckCircle,
    AlertCircle,
    PauseCircle,
    CalendarClock,
    CircleSlash,
} from "lucide-react";

// ──────────────────────────────────────────────
// STATUS COLORS & CONFIG
// ──────────────────────────────────────────────

export const getStatusConfig = (status) => {
    const map = {
        pending: {
            label: "Pending",
            text: "text-amber-700",
            bg: "bg-amber-50",
            border: "border-amber-200",
            icon: Clock,
        },
        approved: {
            label: "Approved",
            text: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-200",
            icon: CalendarClock,
        },
        scheduled: {
            label: "Scheduled",
            text: "text-purple-700",
            bg: "bg-purple-50",
            border: "border-purple-200",
            icon: CalendarClock,
        },
        "in-progress": {
            label: "In Progress",
            text: "text-indigo-700",
            bg: "bg-indigo-50",
            border: "border-indigo-200",
            icon: PauseCircle,
        },
        completed: {
            label: "Completed",
            text: "text-green-700",
            bg: "bg-green-50",
            border: "border-green-200",
            icon: CheckCircle,
        },
        rejected: {
            label: "Rejected",
            text: "text-red-700",
            bg: "bg-red-50",
            border: "border-red-200",
            icon: CircleSlash,
        },
    };

    return map[status?.toLowerCase()] || map["pending"];
};

// ──────────────────────────────────────────────
// PRIORITY CONFIG
// ──────────────────────────────────────────────

export const getPriorityConfig = (priority) => {
    const map = {
        low: {
            label: "Low",
            text: "text-gray-700",
            bg: "bg-gray-100",
            border: "border-gray-200",
        },
        medium: {
            label: "Medium",
            text: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-200",
        },
        high: {
            label: "High",
            text: "text-orange-700",
            bg: "bg-orange-50",
            border: "border-orange-200",
        },
        urgent: {
            label: "Urgent",
            text: "text-red-700",
            bg: "bg-red-50",
            border: "border-red-200",
        },
    };

    return map[priority?.toLowerCase()] || map.medium;
};
