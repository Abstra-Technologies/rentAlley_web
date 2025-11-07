"use client";

import { useRouter } from "next/navigation";
import {
    X,
    FileText,
    CalendarDays,
    User2,
    Building2,
    FileDown,
    FileWarning,
    FileCog,
} from "lucide-react";
import { formatDate } from "@/utils/formatter/formatters";

export default function LeaseDetailsPanel({ lease, onClose }) {
    const router = useRouter();

    if (!lease) return null;

    const hasAgreement = !!lease.agreement_url;
    const pdfUrl = lease.agreement_url;

    const handleSetupLeaseRedirect = () => {
        const agreementId = lease.agreement_id || lease.lease_id;
        router.push(
            `/pages/landlord/properties/${lease.property_id}/activeLease/setup?agreement_id=${agreementId}`
        );
    };

    return (
        <div className="lg:w-1/3 bg-white border border-gray-200 shadow-md rounded-2xl p-5 flex flex-col justify-between relative animate-slideIn">
            {/* ❌ Close Button */}
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
                        <User2 className="w-4 h-4 text-emerald-500" />
                        <span>
                            <span className="font-medium text-gray-500">Email:</span>{" "}
                            {lease.tenant_email || "—"}
                        </span>
                    </p>

                    <p className="flex items-center gap-2">
                        <User2 className="w-4 h-4 text-emerald-500" />
                        <span>
                            <span className="font-medium text-gray-500">Phone:</span>{" "}
                            {lease.tenant_phone || "—"}
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

                    {/* 📄 Agreement Section */}
                    <div className="mt-4 border-t pt-4">
                        <span className="font-medium text-gray-500 block mb-1">
                            Agreement Document:
                        </span>

                        {hasAgreement ? (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-all duration-200"
                            >
                                <FileDown className="w-4 h-4" />
                                View Document
                            </a>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                <div className="flex items-center gap-2">
                                    <FileWarning className="w-4 h-4" />
                                    <p className="text-sm font-medium">
                                        No agreement uploaded yet.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSetupLeaseRedirect}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm hover:from-blue-700 hover:to-emerald-700 transition-all duration-200"
                                >
                                    <FileCog className="w-4 h-4" />
                                    Setup Lease
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>


                <div className="mt-5 flex justify-end">
                    <button
                        onClick={handleSetupLeaseRedirect}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                    >
                        <FileCog className="w-4 h-4" />
                        View Lease
                    </button>
                </div>

        </div>
    );
}
