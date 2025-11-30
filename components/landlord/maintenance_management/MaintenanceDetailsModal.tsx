"use client";

import {
    Calendar,
    CheckCircle,
    Clock,
    Home,
    Tag,
    User,
    Wrench,
    Package,
    Cpu,
    Mail,
    Phone,
    ChevronRight,
} from "lucide-react";
import { getStatusConfig, getPriorityConfig } from "./getStatusConfig";

export default function MaintenanceDetailsModal({
                                                    selectedRequest,
                                                    onClose,
                                                    onStart,
                                                    onComplete,
                                                    onReschedule,
                                                    updateStatus,
                                                    isLocked,
                                                }) {
    const status = getStatusConfig(selectedRequest.status);
    const priority = getPriorityConfig(selectedRequest.priority_level);
    const StatusIcon = status.icon;

    const formatDateTime = (dt) =>
        new Date(dt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl max-h-[92vh] overflow-y-auto">

                {/* HEADER */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-emerald-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-blue-700" />
                            Work Order Details
                        </h2>
                        <p className="text-xs text-gray-600">
                            ID: #{selectedRequest.request_id}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-lg"
                    >
                        <svg
                            className="w-5 h-5 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* STATUS BAR */}
                <div className="p-4 border-b flex flex-wrap gap-2 items-center text-xs">
                    <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${status.bg} ${status.text} border ${status.border}`}
                    >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                    </span>

                    <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
                    >
                        ⚡ {priority.label}
                    </span>
                </div>

                {/* MAIN CONTENT */}
                <div className="p-4 space-y-4">

                    {/* ISSUE SECTION */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-1">
                            Issue: {selectedRequest.subject}
                        </h3>

                        <p className="text-gray-700 text-sm">
                            Description: {selectedRequest.description}
                        </p>

                        {/* TIMELINE */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">

                            <TimelineItem
                                icon={<Calendar className="w-4 h-4 text-blue-600" />}
                                label="Submitted"
                                value={formatDateTime(selectedRequest.created_at)}
                            />

                            <TimelineItem
                                icon={<Tag className="w-4 h-4 text-emerald-600" />}
                                label="Category"
                                value={selectedRequest.category}
                            />

                            {selectedRequest.schedule_date && (
                                <TimelineItem
                                    icon={<Clock className="w-4 h-4 text-purple-600" />}
                                    label="Scheduled"
                                    value={formatDateTime(selectedRequest.schedule_date)}
                                />
                            )}

                            {selectedRequest.completion_date && (
                                <TimelineItem
                                    icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                                    label="Completed"
                                    value={formatDateTime(selectedRequest.completion_date)}
                                />
                            )}
                        </div>
                    </div>

                    {/* PHOTOS */}
                    {selectedRequest.photo_urls?.length > 0 && (
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Photos
                            </h3>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {selectedRequest.photo_urls.map((photo, i) => (
                                    <img
                                        key={i}
                                        src={photo}
                                        onClick={() => window.open(photo, "_blank")}
                                        className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PROPERTY / TENANT / ASSET */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                        {/* PROPERTY */}
                        <CompactCard
                            title="Property"
                            icon={<Home className="w-4 h-4 text-blue-600" />}
                            lines={[
                                selectedRequest.property_name,
                                selectedRequest.unit_name
                                    ? `Unit: ${selectedRequest.unit_name}`
                                    : "No Unit Assigned",
                            ]}
                        />

                        {/* TENANT */}
                        <CompactCard
                            title="Tenant"
                            icon={<User className="w-4 h-4 text-blue-600" />}
                            lines={
                                selectedRequest.tenant_first_name
                                    ? [
                                        `${selectedRequest.tenant_first_name} ${selectedRequest.tenant_last_name}`,
                                        selectedRequest.tenant_email,
                                    ]
                                    : ["No tenant linked"]
                            }
                        />

                        {/* ASSET */}
                        <CompactCard
                            title="Asset"
                            icon={<Package className="w-4 h-4 text-emerald-600" />}
                            lines={
                                selectedRequest.asset
                                    ? [
                                        selectedRequest.asset.asset_name,
                                        selectedRequest.asset.model &&
                                        `Model: ${selectedRequest.asset.model}`,
                                    ]
                                    : ["No asset linked"]
                            }
                        />
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>

                        <div className="flex flex-col sm:flex-row gap-3">

                            {/* PENDING */}
                            {selectedRequest.status === "pending" && (
                                <>
                                    <button
                                        onClick={() =>
                                            updateStatus(selectedRequest.request_id, "approved")
                                        }
                                        className="btn-primary-green"
                                    >
                                        Approve
                                    </button>

                                    <button
                                        onClick={() =>
                                            updateStatus(selectedRequest.request_id, "rejected")
                                        }
                                        className="btn-primary-red"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}

                            {/* APPROVED */}
                            {selectedRequest.status === "approved" && (
                                <button onClick={onStart} className="btn-primary-blue">
                                    Assign & Schedule
                                </button>
                            )}

                            {/* SCHEDULED */}
                            {selectedRequest.status === "scheduled" && (
                                <>
                                    <button onClick={onStart} className="btn-primary-blue">
                                        Start Work
                                    </button>

                                    <button onClick={onReschedule} className="btn-primary-amber">
                                        Reschedule
                                    </button>
                                </>
                            )}

                            {/* IN PROGRESS */}
                            {selectedRequest.status === "in-progress" && (
                                <button onClick={onComplete} className="btn-primary-purple">
                                    Mark Complete
                                </button>
                            )}

                            {/* DONE */}
                            {(selectedRequest.status === "completed" ||
                                selectedRequest.status === "rejected") && (
                                <button onClick={onClose} className="btn-gray">
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

/* ───────────────────────────────
   MINI COMPONENTS
──────────────────────────────── */

function TimelineItem({ icon, label, value }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-[11px] text-gray-600">{label}</p>
                <p className="text-[13px] font-semibold">{value}</p>
            </div>
        </div>
    );
}

function CompactCard({ icon, title, lines }) {
    return (
        <div className="border bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <h4 className="text-sm font-semibold">{title}</h4>
            </div>

            <div className="text-xs text-gray-700 space-y-1">
                {lines.map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </div>
        </div>
    );
}
