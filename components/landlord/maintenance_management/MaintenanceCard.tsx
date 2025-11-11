"use client";

import {
    Calendar,
    Clock,
    CheckCircle,
    Image as ImageIcon,
} from "lucide-react";
import { getStatusConfig, getPriorityConfig } from "./getStatusConfig";

export default function MaintenanceCard({
                                            request,
                                            setSelectedImage,
                                            handleViewDetails,
                                        }: {
    request: any;
    setSelectedImage: (url: string) => void;
    handleViewDetails: (req: any) => void;
}) {
    const statusConfig = getStatusConfig(request.status);
    const priorityConfig = getPriorityConfig(request.priority_level);
    const StatusIcon = statusConfig.icon;

    const formatDateTime = (date: string | null) => {
        if (!date) return "—";
        const d = new Date(date);
        return `${d.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
        })} • ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    };

    return (
        <div
            onClick={() => handleViewDetails(request)}
            className="
        w-full bg-white border-b border-gray-100
        hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50
        hover:shadow-md hover:border-blue-200
        transition-all duration-200
        cursor-pointer group
      "
        >
            {/* Row layout */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-4 p-3 sm:items-center text-sm">
                {/* Thumbnail + Task Info */}
                <div className="flex items-start sm:items-center gap-3 col-span-2">
                    {/* Thumbnail */}
                    <div
                        className="
              relative w-10 h-10 rounded-md overflow-hidden border border-gray-200
              flex-shrink-0 group-hover:border-blue-300 transition-all duration-200
            "
                        onClick={(e) => {
                            e.stopPropagation(); // prevent triggering modal
                            if (request.photo_urls?.length)
                                setSelectedImage(request.photo_urls[0]);
                        }}
                    >
                        {request.photo_urls?.length ? (
                            <img
                                src={request.photo_urls[0]}
                                alt="Maintenance preview"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                <ImageIcon className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
            <span className="font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
              {request.subject || "Maintenance Task"}
            </span>
                        <span className="text-xs text-gray-500 truncate">
              By {request.tenant_first_name} {request.tenant_last_name}
            </span>
                        {request.priority_level && (
                            <span
                                className={`inline-block mt-1 px-2 py-[2px] rounded-md text-[11px] font-medium ${priorityConfig.bg} ${priorityConfig.text}`}
                            >
                {priorityConfig.label} Priority
              </span>
                        )}
                    </div>
                </div>

                {/* Related Unit */}
                <div className="text-gray-700">
                    <p className="font-medium text-[13px] truncate">
                        {request.unit_name || "—"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                        {request.property_name || "—"}
                    </p>
                </div>

                {/* Assigned To */}
                <div className="flex items-center gap-2 text-gray-700">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">
                        {request.assigned_to?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">
                            {request.assigned_to || "Unassigned"}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                            {request.assigned_role || "Technician"}
                        </p>
                    </div>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{formatDateTime(request.due_date)}</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
          <span
              className={`inline-flex items-center gap-1 px-2 py-1 text-[12px] rounded-md font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
          </span>
                </div>
            </div>

            {/* Mobile Thumbnail Preview */}
            {request.photo_urls?.length > 1 && (
                <div className="sm:hidden px-3 pb-3 flex gap-2 overflow-x-auto">
                    {request.photo_urls.slice(0, 3).map((photo: string, idx: number) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(photo);
                            }}
                            className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 hover:border-blue-300 transition-all duration-200"
                        >
                            <img
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
