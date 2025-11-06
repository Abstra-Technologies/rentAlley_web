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
} from "lucide-react";
import { getStatusConfig, getPriorityConfig } from "./getStatusConfig";

export default function MaintenanceDetailsModal({
                                                    selectedRequest,
                                                    onClose,
                                                    onStart,
                                                    onComplete,
                                                    updateStatus,
                                                    isLocked,
                                                }: {
    selectedRequest: any;
    onClose: () => void;
    onStart: () => void;
    onComplete: () => void;
    updateStatus: any;
    isLocked: boolean;
}) {
    const status = getStatusConfig(selectedRequest.status);
    const priority = getPriorityConfig(selectedRequest.priority);
    const StatusIcon = status.icon;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Wrench className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                                    Maintenance Request Details
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Request ID: #{selectedRequest.request_id}
                                </p>
                            </div>
                        </div>

                        {/* Status + Priority badges */}
                        <div className="flex flex-col items-end gap-1">
              <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
              </span>

                            {selectedRequest.priority && (
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
                                >
                  ⚡ {priority.label} Priority
                </span>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 sm:p-6 flex-grow">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - 2/3 width */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Subject & Description */}
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 sm:p-5">
                                <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3">
                                    {selectedRequest.subject}
                                </h3>
                                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedRequest.description}
                                    </p>
                                </div>

                                {/* Dates Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Submitted</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {new Date(selectedRequest.created_at).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    }
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Tag className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Category</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {selectedRequest.category}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedRequest.schedule_date && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Scheduled</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {new Date(
                                                        selectedRequest.schedule_date
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedRequest.completion_date && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Completed</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {new Date(
                                                        selectedRequest.completion_date
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Photos */}
                            {selectedRequest.photo_urls &&
                                selectedRequest.photo_urls.length > 0 && (
                                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 sm:p-5">
                                        <h3 className="font-bold text-gray-900 mb-4">
                                            Photos ({selectedRequest.photo_urls.length})
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {selectedRequest.photo_urls.map(
                                                (photo: string, index: number) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => window.open(photo, "_blank")}
                                                        className="relative group cursor-pointer h-24 sm:h-28 overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                                                    >
                                                        <img
                                                            src={photo}
                                                            alt={`Issue ${index + 1}`}
                                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="bg-white rounded-full p-2">
                                                                <EyeIcon className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Sidebar - 1/3 width */}
                        <div className="space-y-6">
                            {/* Property Info */}
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Home className="w-4 h-4 text-blue-600" />
                                    Property Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Property</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedRequest.property_name}
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Unit</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedRequest.unit_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tenant Info */}
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Tenant Information
                                </h3>
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-blue-600">
                      {selectedRequest.tenant_first_name?.charAt(0)}
                        {selectedRequest.tenant_last_name?.charAt(0)}
                    </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {selectedRequest.tenant_first_name}{" "}
                                            {selectedRequest.tenant_last_name}
                                        </p>
                                        {selectedRequest.tenant_email && (
                                            <p className="text-xs text-gray-600 mt-1 truncate">
                                                {selectedRequest.tenant_email}
                                            </p>
                                        )}
                                        {selectedRequest.tenant_phone && (
                                            <p className="text-xs text-gray-600 truncate">
                                                {selectedRequest.tenant_phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
                                <h3 className="font-bold text-gray-900 mb-4">Actions</h3>
                                <div className="space-y-2">
                                    {selectedRequest.status.toLowerCase() === "pending" && (
                                        <button
                                            onClick={onStart}
                                            disabled={isLocked}
                                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Start Work
                                        </button>
                                    )}

                                    {selectedRequest.status.toLowerCase() === "scheduled" && (
                                        <button
                                            onClick={onStart}
                                            disabled={isLocked}
                                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Start Work
                                        </button>
                                    )}

                                    {selectedRequest.status.toLowerCase() === "in-progress" && (
                                        <button
                                            onClick={onComplete}
                                            disabled={isLocked}
                                            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Mark as Completed
                                        </button>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
