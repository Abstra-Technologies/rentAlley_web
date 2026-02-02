import {
  Clock,
  CheckCircle,
  CalendarClock,
  Play,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// ============================================
// STATUS CONFIGURATION
// ============================================
export const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    shortLabel: "Pending",
    description: "Awaiting landlord approval",
    icon: Clock,
    bgLight: "bg-amber-50",
    bgDark: "bg-amber-500",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-500 to-orange-500",
  },
  approved: {
    label: "Approved",
    shortLabel: "Approved",
    description: "Ready to schedule",
    icon: CheckCircle,
    bgLight: "bg-emerald-50",
    bgDark: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-green-500",
  },
  scheduled: {
    label: "Scheduled",
    shortLabel: "Scheduled",
    description: "Work date set",
    icon: CalendarClock,
    bgLight: "bg-purple-50",
    bgDark: "bg-purple-500",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-500 to-indigo-500",
  },
  "in-progress": {
    label: "In Progress",
    shortLabel: "In Progress",
    description: "Work underway",
    icon: Play,
    bgLight: "bg-blue-50",
    bgDark: "bg-blue-500",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-500 to-cyan-500",
  },
  completed: {
    label: "Completed",
    shortLabel: "Completed",
    description: "Work finished",
    icon: CheckCircle,
    bgLight: "bg-green-50",
    bgDark: "bg-green-500",
    text: "text-green-700",
    border: "border-green-200",
    gradient: "from-green-500 to-emerald-500",
  },
  rejected: {
    label: "Rejected",
    shortLabel: "Rejected",
    description: "Request declined",
    icon: XCircle,
    bgLight: "bg-red-50",
    bgDark: "bg-red-500",
    text: "text-red-700",
    border: "border-red-200",
    gradient: "from-red-500 to-rose-500",
  },
} as const;

export const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
  medium: {
    label: "Medium",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  high: {
    label: "High",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  urgent: {
    label: "Urgent",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
} as const;

// ============================================
// TYPES
// ============================================
export type StatusKey = keyof typeof STATUS_CONFIG;
export type PriorityKey = keyof typeof PRIORITY_CONFIG;

export interface StatusConfigType {
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  bgLight: string;
  bgDark: string;
  text: string;
  border: string;
  gradient: string;
}

export interface PriorityConfigType {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getStatusConfig(
  status: string | undefined | null,
): StatusConfigType {
  if (!status) return STATUS_CONFIG.pending;
  const normalized = status.toLowerCase().replace(/_/g, "-") as StatusKey;
  return STATUS_CONFIG[normalized] || STATUS_CONFIG.pending;
}

export function getPriorityConfig(
  priority: string | undefined | null,
): PriorityConfigType {
  if (!priority) return PRIORITY_CONFIG.low;
  const normalized = priority.toLowerCase() as PriorityKey;
  return PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.low;
}

export function normalizeStatus(status: string | undefined | null): string {
  if (!status) return "pending";
  return status.toLowerCase().replace(/_/g, "-");
}
