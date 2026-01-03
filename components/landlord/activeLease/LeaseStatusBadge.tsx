"use client";

import { Clock } from "lucide-react";

/* ===============================
   HELPERS
================================ */
const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

/* ===============================
   STATUS BADGE
================================ */
export function StatusBadge({ lease }: { lease: any }) {
    const base =
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border capitalize";

    // Invite-only row (before lease exists)
    if (lease.type === "invite") {
        return (
            <span className={`${base} bg-amber-100 text-amber-800 border-amber-200`}>
                <Clock className="w-3 h-3" />
                Invite Pending
            </span>
        );
    }

    const status = getStatus(lease);

    const MAP: Record<string, string> = {
        draft: "bg-blue-100 text-blue-800 border-blue-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        sent: "bg-amber-100 text-amber-800 border-amber-200",
        pending_signature: "bg-amber-100 text-amber-800 border-amber-200",

        landlord_signed: "bg-indigo-100 text-indigo-800 border-indigo-200",
        tenant_signed: "bg-indigo-100 text-indigo-800 border-indigo-200",

        active: "bg-green-100 text-green-800 border-green-200",
        completed: "bg-emerald-100 text-emerald-800 border-emerald-200",

        expired: "bg-red-50 text-red-700 border-red-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
        <span
            className={`${base} ${
                MAP[status] || "bg-gray-50 text-gray-500 border-gray-200"
            }`}
        >
            {status?.replaceAll("_", " ") || "unknown"}
        </span>
    );
}
