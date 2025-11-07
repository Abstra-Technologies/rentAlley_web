"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    X,
    FileText,
    CalendarDays,
    User2,
    Building2,
    FileDown,
    FileWarning,
    ZoomIn,
    ZoomOut,
    RefreshCcw,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function LeaseDetailsPanel({ lease, onClose }) {
    const router = useRouter();
    const [showViewer, setShowViewer] = useState(false);
    const [scale, setScale] = useState(1.2);
    const [numPages, setNumPages] = useState<number | null>(null);

    if (!lease) return null;
    const hasAgreement = !!lease.agreement_url || !!lease.agreement_document;

    const handleSetupLeaseRedirect = () => {
        const agreementId = lease.agreement_id || lease.lease_id;
        router.push(
            `/pages/landlord/properties/${lease.property_id}/activeLease/setup?agreement_id=${agreementId}`
        );
    };

    const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
    const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.8));
    const handleResetZoom = () => setScale(1.2);

    const docUrl = lease.agreement_url || lease.agreement_document;

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
                    <p className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        <span>
              <span className="font-medium text-gray-500">Agreement URL:</span>{" "}
                            {lease.agreement_url}
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

                    {/* 📄 Agreement Document Section */}
                    <div className="mt-4 border-t pt-4">
            <span className="font-medium text-gray-500 block mb-1">
              Agreement Document:
            </span>

                        {hasAgreement ? (
                            <button
                                onClick={() => setShowViewer(true)}
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                <FileDown className="w-4 h-4" />
                                View / Download Agreement
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded-md">
                                <FileWarning className="w-4 h-4" />
                                <p className="text-sm font-medium">
                                    No agreement uploaded yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 space-y-3">
                {lease.lease_status === "active" && (
                    <>
                        {!hasAgreement && (
                            <button
                                onClick={handleSetupLeaseRedirect}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition"
                            >
                                Setup Lease Agreement
                            </button>
                        )}
                    </>
                )}

                {lease.lease_status === "draft" && (
                    <button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-emerald-700 transition">
                        Continue Setup
                    </button>
                )}
            </div>

            {/* 📄 Modal Viewer */}
            {showViewer && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
                    <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
                                Lease Agreement Document
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 rounded-md hover:bg-gray-200 transition"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleResetZoom}
                                    className="p-2 rounded-md hover:bg-gray-200 transition"
                                    title="Reset Zoom"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 rounded-md hover:bg-gray-200 transition"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowViewer(false)}
                                    className="ml-2 p-2 rounded-md hover:bg-red-100 text-red-600 transition"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* PDF Viewer */}
                        <div className="flex-1 overflow-auto bg-gray-100 flex justify-center items-center">
                            {docUrl?.toLowerCase().endsWith(".pdf") ? (
                                <Document
                                    file={docUrl}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    loading={
                                        <p className="text-gray-500 animate-pulse text-sm mt-4">
                                            Loading document...
                                        </p>
                                    }
                                >
                                    {Array.from(new Array(numPages), (el, index) => (
                                        <Page
                                            key={`page_${index + 1}`}
                                            pageNumber={index + 1}
                                            scale={scale}
                                            className="shadow-sm mb-3"
                                        />
                                    ))}
                                </Document>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    <p>Preview not available. Please download the file.</p>
                                    <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Download here
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
