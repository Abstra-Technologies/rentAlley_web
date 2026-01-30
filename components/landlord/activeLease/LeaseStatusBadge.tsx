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

    /* ===============================
       INVITE (NO LEASE YET)
    ================================ */
    if (lease.type === "invite") {
        return (
            <span
                className={`${base} bg-amber-100 text-amber-800 border-amber-200`}
            >
                <Clock className="w-3 h-3" />
                Invite Pending
            </span>
        );
    }

    const status = getStatus(lease);

    /* ===============================
       STYLE MAP
    ================================ */
    const STYLE_MAP: Record<string, string> = {
        // Draft / Sending
        draft: "bg-blue-100 text-blue-800 border-blue-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        sent: "bg-amber-100 text-amber-800 border-amber-200",

        // Signatures (raw)
        pending_signature: "bg-amber-100 text-amber-800 border-amber-200",
        landlord_signed: "bg-indigo-100 text-indigo-800 border-indigo-200",
        tenant_signed: "bg-indigo-100 text-indigo-800 border-indigo-200",

        // 🔐 Derived signature states (NEW)
        landlord_pending_signature:
            "bg-orange-100 text-orange-800 border-orange-200",
        tenant_pending_signature:
            "bg-sky-100 text-sky-800 border-sky-200",

        // Active / Finished
        active: "bg-green-100 text-green-800 border-green-200",
        completed: "bg-emerald-100 text-emerald-800 border-emerald-200",

        // Terminated
        expired: "bg-red-50 text-red-700 border-red-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    /* ===============================
       HUMAN LABELS
    ================================ */
    const LABEL_MAP: Record<string, string> = {
        draft: "Draft",
        pending: "Pending",
        sent: "Sent",

        pending_signature: "Awaiting Signatures",
        landlord_pending_signature: "Awaiting Landlord Signature",
        tenant_pending_signature: "Awaiting Tenant Signature",

        landlord_signed: "Landlord Signed",
        tenant_signed: "Tenant Signed",

        active: "Active",
        completed: "Completed",

        expired: "Expired",
        cancelled: "Cancelled",
    };

    return (
        <span
            className={`${base} ${
                STYLE_MAP[status] ||
                "bg-gray-50 text-gray-500 border-gray-200"
            }`}
        >
            {LABEL_MAP[status] || status?.replaceAll("_", " ") || "Unknown"}
        </span>
    );
}
