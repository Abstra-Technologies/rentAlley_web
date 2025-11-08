"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  X,
  FileText,
  Calendar,
  User,
  Building2,
  FileDown,
  AlertCircle,
  Eye,
  Mail,
  Phone,
} from "lucide-react";
import { formatDate } from "@/utils/formatter/formatters";

export default function LeaseDetailsPanel({ lease, onClose }) {
  const router = useRouter();

  const [signatures, setSignatures] = useState<any[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  if (!lease) return null;

  const hasAgreement = !!lease.agreement_url;
  const pdfUrl = lease.agreement_url;

  const signedCount = signatures.filter((s) => s.status === "signed").length;
  const totalCount = 2;
  const signatureProgress = Math.round((signedCount / totalCount) * 100);

  useEffect(() => {
    setSignatures([]);
    setTrackingEnabled(false);

    if (!lease?.lease_id) return;

    axios
      .get(
        `/api/landlord/activeLease/signatureTracking?agreement_id=${lease.lease_id}`
      )
      .then((res) => {
        const data = res.data;
        const sigs =
          data && Array.isArray(data.signatures) ? data.signatures : [];
        setSignatures(sigs);
        setTrackingEnabled(Boolean(data.tracking_enabled));
      })
      .catch((err) => console.error("Failed to fetch signatures", err));
  }, [lease?.lease_id]);

  const handleViewLease = () => {
    const agreementId = lease.agreement_id || lease.lease_id;
    router.push(
      `/pages/landlord/properties/${lease.property_id}/activeLease/leaseDetails/${agreementId}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex flex-col w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white flex-shrink-0" />
            <h2 className="text-lg font-bold text-white">Lease Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors flex-shrink-0"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Lease ID */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                Lease ID
              </p>
              <p className="text-base font-semibold text-gray-900">
                {lease.lease_id || "—"}
              </p>
            </div>

            {/* Unit */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Unit</p>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <p className="text-base font-semibold text-gray-900">
                  {lease.unit_name}
                </p>
              </div>
            </div>

            {/* Tenant */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Tenant</p>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <p className="text-base font-semibold text-gray-900">
                  {lease.tenant_name}
                </p>
              </div>
            </div>

            {/* Email */}
            {lease.tenant_email && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  Email
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <p className="text-sm text-gray-900 break-all">
                    {lease.tenant_email}
                  </p>
                </div>
              </div>
            )}

            {/* Phone */}
            {lease.tenant_phone && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  Phone
                </p>
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <p className="text-base text-gray-900">
                    {lease.tenant_phone}
                  </p>
                </div>
              </div>
            )}

            {/* Start Date */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                Start Date
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <p className="text-base text-gray-900">
                  {lease.start_date ? formatDate(lease.start_date) : "N/A"}
                </p>
              </div>
            </div>

            {/* End Date */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                End Date
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <p className="text-base text-gray-900">
                  {lease.end_date ? formatDate(lease.end_date) : "N/A"}
                </p>
              </div>
            </div>

            {/* Agreement Document */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Agreement Document
              </p>
              {hasAgreement ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm transition-colors border border-blue-200 w-full justify-center"
                >
                  <FileDown className="w-4 h-4" />
                  View Document
                </a>
              ) : (
                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">No agreement uploaded yet.</p>
                </div>
              )}
            </div>

            {/* Signature Progress */}
            {Array.isArray(signatures) &&
              signatures.length === 2 &&
              trackingEnabled && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-3">
                    Signature Progress
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
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
                      : `${signatureProgress}% completed — ${2 - signedCount} ${
                          2 - signedCount > 1 ? "parties" : "party"
                        } remaining.`}
                  </p>

                  {/* Signatures list */}
                  <div className="space-y-2">
                    {signatures.map((sig) => (
                      <div
                        key={sig.id ?? sig.role}
                        className={`flex items-center justify-between text-sm px-3 py-2.5 rounded-lg border ${
                          sig.status === "signed"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold capitalize">
                            {sig.role}
                          </span>
                          {sig.email && (
                            <span className="text-xs text-gray-500 truncate">
                              {sig.email}
                            </span>
                          )}
                        </div>

                        <span className="text-xs ml-2 flex-shrink-0">
                          {sig.status === "signed"
                            ? `Signed ${
                                sig.signed_at
                                  ? new Date(sig.signed_at).toLocaleDateString()
                                  : ""
                              }`
                            : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Action Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleViewLease}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
              >
                <Eye className="w-4 h-4" />
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
