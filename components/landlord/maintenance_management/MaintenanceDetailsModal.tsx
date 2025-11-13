"use client";

import {
    Calendar,
    CheckCircle,
    Clock,
    EyeIcon,
    Home,
    Tag,
    User,
    Wrench,
    Package,
    Cpu,
} from "lucide-react";
import { getStatusConfig, getPriorityConfig } from "./getStatusConfig";

export default function MaintenanceDetailsModal({
    selectedRequest,
    onClose,
    onStart,
    onComplete,
    onReschedule,    // NEW: triggers reschedule workflow
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* HEADER */}
                <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-emerald-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-emerald-200 rounded-lg flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Maintenance Request</h2>
                            <p className="text-sm text-gray-600">Request ID: #{selectedRequest.request_id}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}
                        >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                        </span>

                        {selectedRequest.priority_level && (
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
                            >
                                ⚡ {priority.label} Priority
                            </span>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* MAIN PANEL */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* DESCRIPTION */}
                            <div className="bg-white border rounded-lg p-5 shadow-sm">
                                <h3 className="font-bold text-gray-900 text-lg mb-3">
                                    Issue: {selectedRequest.subject}
                                </h3>

                                <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg border leading-relaxed">
                                    {selectedRequest.description}
                                </p>

                                {/* PRIORITY */}
                                {selectedRequest.priority_level && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Priority:</span>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${priority.bg} ${priority.text}`}
                                        >
                                            ⚡ {priority.label}
                                        </span>
                                    </div>
                                )}

                                {/* DATES */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

                                    {/* Submitted */}
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Submitted</p>
                                            <p className="font-semibold text-gray-900">
                                                {formatDateTime(selectedRequest.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <Tag className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Category</p>
                                            <p className="font-semibold text-gray-900">
                                                {selectedRequest.category}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Scheduled */}
                                    {selectedRequest.schedule_date && (
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Scheduled</p>
                                                <p className="font-semibold text-gray-900">
                                                    {formatDateTime(selectedRequest.schedule_date)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Completed */}
                                    {selectedRequest.completion_date && (
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Completed</p>
                                                <p className="font-semibold text-gray-900">
                                                    {formatDateTime(selectedRequest.completion_date)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* PHOTOS */}
                            {selectedRequest.photo_urls?.length > 0 && (
                                <div className="bg-white border rounded-lg p-5 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4">
                                        Photos ({selectedRequest.photo_urls.length})
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {selectedRequest.photo_urls.map((photo, i) => (
                                            <button
                                                key={i}
                                                onClick={() => window.open(photo, "_blank")}
                                                className="relative rounded-lg overflow-hidden border"
                                            >
                                                <img
                                                    src={photo}
                                                    alt=""
                                                    className="w-full h-28 object-cover hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition"></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ACTION BUTTONS */}
                            <div className="bg-white border rounded-lg p-5 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-5">Actions</h3>

                                <div className="flex flex-col sm:flex-row gap-4">

                                    {/* PENDING */}
                                    {selectedRequest.status === "pending" && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    updateStatus(selectedRequest.request_id, "approved")
                                                }
                                                className="btn-primary-green"
                                                disabled={isLocked}
                                            >
                                                Approve
                                            </button>

                                            <button
                                                onClick={() =>
                                                    updateStatus(selectedRequest.request_id, "rejected")
                                                }
                                                className="btn-primary-red"
                                                disabled={isLocked}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {/* APPROVED */}
                                    {selectedRequest.status === "approved" && (
                                        <button
                                            onClick={onStart}
                                            className="btn-primary-blue"
                                            disabled={isLocked}
                                        >
                                            Assign & Schedule
                                        </button>
                                    )}

                                    {/* SCHEDULED */}
                                    {selectedRequest.status === "scheduled" && (
                                        <>
                                            <button
                                                onClick={onStart}
                                                className="btn-primary-blue"
                                                disabled={isLocked}
                                            >
                                                🚀 Start Work
                                            </button>

                                            <button
                                                onClick={onReschedule}
                                                className="btn-primary-amber"
                                                disabled={isLocked}
                                            >
                                                🔄 Reschedule
                                            </button>
                                        </>
                                    )}

                                    {/* IN PROGRESS */}
                                    {selectedRequest.status === "in-progress" && (
                                        <button
                                            onClick={onComplete}
                                            className="btn-primary-purple"
                                            disabled={isLocked}
                                        >
                                            Mark as Completed
                                        </button>
                                    )}

                                    {/* COMPLETED / REJECTED */}
                                    {(selectedRequest.status === "completed" ||
                                        selectedRequest.status === "rejected") && (
                                        <button onClick={onClose} className="btn-gray">
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR */}
                        <div className="space-y-6">

                            {/* ASSET */}
                            {selectedRequest.asset && (
                                <div className="bg-white border rounded-lg p-5 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-emerald-600" />
                                        Linked Asset
                                    </h3>

                                    <p className="font-semibold text-gray-900">
                                        {selectedRequest.asset.asset_name}
                                    </p>

                                    {selectedRequest.asset.model && (
                                        <p className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                                            <Cpu className="w-3.5 h-3.5 text-purple-600" />
                                            {selectedRequest.asset.model}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* PROPERTY INFO */}
                            <div className="bg-white border rounded-lg p-5 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Home className="w-4 h-4 text-blue-600" />
                                    Property Details
                                </h3>

                                <p className="font-semibold text-gray-900">
                                    {selectedRequest.property_name}
                                </p>

                                <p className="text-xs text-gray-600 mt-1">
                                    Unit: {selectedRequest.unit_name}
                                </p>
                            </div>

                            {/* TENANT INFO */}
                            <div className="bg-white border rounded-lg p-5 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Tenant Information
                                </h3>

                                <p className="font-semibold text-gray-900">
                                    {selectedRequest.tenant_first_name} {selectedRequest.tenant_last_name}
                                </p>

                                <p className="text-xs text-gray-600">
                                    {selectedRequest.tenant_email}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
