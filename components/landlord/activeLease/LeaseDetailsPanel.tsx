"use client";
import { useState, useEffect } from "react";
import axios from "axios";
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

    /* --------------------------------------------------------------
     * 1. Signatures are **reset on every lease change**
     * -------------------------------------------------------------- */
    const [signatures, setSignatures] = useState<any[]>([]);
    const [trackingEnabled, setTrackingEnabled] = useState(false);

    if (!lease) return null;

    const hasAgreement = !!lease.agreement_url;
    const pdfUrl = lease.agreement_url;

    /* --------------------------------------------------------------
     * 2. Progress is calculated **only from the current signatures**
     * -------------------------------------------------------------- */
    const signedCount = signatures.filter((s) => s.status === "signed").length;
    const totalCount = 2; // landlord + tenant
    const signatureProgress = Math.round((signedCount / totalCount) * 100);

    useEffect(() => {
        // Reset previous data
        setSignatures([]);
        setTrackingEnabled(false);

        if (!lease?.lease_id) return;

        axios
            .get(`/api/landlord/activeLease/signatureTracking?agreement_id=${lease.lease_id}`)
            .then((res) => {
                const data = res.data;
                const sigs = data && Array.isArray(data.signatures) ? data.signatures : [];
                setSignatures(sigs);
                setTrackingEnabled(Boolean(data.tracking_enabled)); // use API flag
            })
            .catch((err) => console.error("Failed to fetch signatures", err));
    }, [lease?.lease_id]);

    const handleSetupLeaseRedirect = () => {
        const agreementId = lease.agreement_id || lease.lease_id;
        router.push(
            `/pages/landlord/properties/${lease.property_id}/activeLease/setup?agreement_id=${agreementId}`
        );
    };

    return (
        <div className="lg:w-1/3 bg-white border border-gray-200 shadow-md rounded-2xl p-5 flex flex-col justify-between relative animate-slideIn">
            {/* Close button */}
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
                    {/* ---- Basic info ---- */}
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

                    {/* ---- Agreement document ---- */}
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


                    {Array.isArray(signatures) && signatures.length === 2 && trackingEnabled && (
                        <div className="mt-4 border-t pt-4">
    <span className="font-medium text-gray-500 block mb-2">
      Signature Progress:
    </span>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${
                                        signatureProgress === 100
                                            ? "bg-gradient-to-r from-emerald-500 to-green-600"
                                            : "bg-gradient-to-r from-blue-500 to-indigo-600"
                                    }`}
                                    style={{ width: `${signatureProgress}%` }}
                                />
                            </div>

                            {/* Summary text */}
                            <p className="text-sm text-gray-600 mb-3">
                                {signatureProgress === 100
                                    ? "Both parties have signed the lease."
                                    : `${signatureProgress}% completed — ${2 - signedCount} party${
                                        2 - signedCount > 1 ? "ies" : "y"
                                    } remaining.`}
                            </p>

                            {/* Who signed */}
                            <div className="space-y-2">
                                {signatures.map((sig) => (
                                    <div
                                        key={sig.id ?? sig.role}
                                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm px-3 py-2 rounded-md border ${
                                            sig.status === "signed"
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                : "bg-gray-50 border-gray-200 text-gray-600"
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <span className="font-medium capitalize">{sig.role}</span>
                                            {sig.email && (
                                                <span className="text-gray-500 text-xs sm:text-sm">({sig.email})</span>
                                            )}
                                        </div>

                                        <span className="mt-1 sm:mt-0">
            {sig.status === "signed"
                ? `Signed ${
                    sig.signed_at ? new Date(sig.signed_at).toLocaleDateString() : ""
                }`
                : "Pending"}
          </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {/* Bottom button */}
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