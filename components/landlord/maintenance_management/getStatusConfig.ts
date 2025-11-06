// components/landlord/maintenance_management/getStatusConfig.ts
import { Calendar, CheckCircle, Clock, Wrench, XCircle } from "lucide-react";

// 🟦 STATUS CONFIG
export const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
        case "pending":
            return {
                bg: "bg-amber-100",
                text: "text-amber-700",
                border: "border-amber-200",
                icon: Clock,
                label: "Pending",
            };
        case "scheduled":
            return {
                bg: "bg-blue-100",
                text: "text-blue-700",
                border: "border-blue-200",
                icon: Calendar,
                label: "Scheduled",
            };
        case "in-progress":
            return {
                bg: "bg-purple-100",
                text: "text-purple-700",
                border: "border-purple-200",
                icon: Wrench,
                label: "In Progress",
            };
        case "completed":
            return {
                bg: "bg-emerald-100",
                text: "text-emerald-700",
                border: "border-emerald-200",
                icon: CheckCircle,
                label: "Completed",
            };
        default:
            return {
                bg: "bg-gray-100",
                text: "text-gray-700",
                border: "border-gray-200",
                icon: XCircle,
                label: "Unknown",
            };
    }
};

// 🟩 PRIORITY CONFIG
export const getPriorityConfig = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case "high":
            return {
                bg: "bg-red-100",
                text: "text-red-700",
                border: "border-red-200",
                label: "High",
            };
        case "medium":
            return {
                bg: "bg-yellow-100",
                text: "text-yellow-700",
                border: "border-yellow-200",
                label: "Medium",
            };
        case "low":
            return {
                bg: "bg-green-100",
                text: "text-green-700",
                border: "border-green-200",
                label: "Low",
            };
        default:
            return {
                bg: "bg-gray-100",
                text: "text-gray-700",
                border: "border-gray-200",
                label: "Normal",
            };
    }
};
