"use client";

import { X, FileText, CalendarDays, User2, Building2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters"; // ✅ use shared formatters

export default function LeaseDetailsPanel({ lease, onClose }) {
    if (!lease) return null;

    return (
        <div className="lg:w-1/3 bg-white border border-gray-200 shadow-md rounded-2xl p-5 flex flex-col justify-between relative animate-slideIn">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                title="Close details"
            >
                <X className="w-5 h-5" />
            </button>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Lease Details
                </h2>

                <div className="space-y-3 text-sm text-gray-700">
                    <p>
                        <span className="font-medium text-gray-500">Lease ID:</span>{" "}
                        {lease.lease_id || "—"}
                    </p>
                    <p>
                        <span className="font-medium text-gray-500">Agreement ID:</span>{" "}
                        {lease.agreement_id || "—"}
                    </p>

                    <p className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span>
              <span className="font-medium text-gray-500">Unit:</span>{" "}
                            {lease.unit_name}
            </span>
                    </p>

                    <p className="flex items-center gap-2">
                        <User2 className="w-4 h-4 text-emerald-500" />
                        <span>
              <span className="font-medium text-gray-500">Tenant:</span>{" "}
                            {lease.tenant_name}
            </span>
                    </p>

                    <p className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        <span>
              <span className="font-medium text-gray-500">Start Date:</span>{" "}
                            {lease.start_date ? formatDate(lease.start_date) : "N/A"}
            </span>
                    </p>

                    <p className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        <span>
              <span className="font-medium text-gray-500">End Date:</span>{" "}
                            {lease.end_date ? formatDate(lease.end_date) : "N/A"}
            </span>
                    </p>

                    <p>
                        <span className="font-medium text-gray-500">Status:</span>{" "}
                        <span
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                lease.lease_status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : lease.lease_status === "pending"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : lease.lease_status === "draft"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
              {lease.lease_status}
            </span>
                    </p>

                    <p>
                        <span className="font-medium text-gray-500">Monthly Rent:</span>{" "}
                        <span className="text-emerald-700 font-semibold">
              {formatCurrency(lease.rent_amount || 0)}
            </span>
                    </p>

                    {lease.security_deposit && (
                        <p>
              <span className="font-medium text-gray-500">
                Security Deposit:
              </span>{" "}
                            {formatCurrency(lease.security_deposit || 0)}
                        </p>
                    )}

                    {lease.created_at && (
                        <p>
                            <span className="font-medium text-gray-500">Created At:</span>{" "}
                            {formatDate(lease.created_at)}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                {lease.lease_status === "active" && (
                    <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition">
                        Manage Lease
                    </button>
                )}
                {lease.lease_status === "draft" && (
                    <button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-emerald-700 transition">
                        Continue Setup
                    </button>
                )}
            </div>
        </div>
    );
}
