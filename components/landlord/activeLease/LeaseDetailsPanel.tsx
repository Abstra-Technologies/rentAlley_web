"use client";

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

  if (!lease) return null;

  const hasAgreement = !!lease.agreement_url;
  const pdfUrl = lease.agreement_url;

  const handleViewLease = () => {
    const agreementId = lease.agreement_id || lease.lease_id;
    router.push(
      `/pages/landlord/properties/${lease.property_id}/activeLease/leaseDetails/${agreementId}`
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-white flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-white">
            Lease Details
          </h2>
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
      <div className="p-4 sm:p-6 overflow-y-auto flex-1">
        <div className="space-y-4">
          {/* Lease ID */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Lease ID</p>
            <p className="text-sm font-medium text-gray-900">
              {lease.lease_id || "—"}
            </p>
          </div>

          {/* Unit */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Unit</p>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-900">
                {lease.unit_name}
              </p>
            </div>
          </div>

          {/* Tenant */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Tenant</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-900">
                {lease.tenant_name}
              </p>
            </div>
          </div>

          {/* Email */}
          {lease.tenant_email && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900">{lease.tenant_email}</p>
              </div>
            </div>
          )}

          {/* Phone */}
          {lease.tenant_phone && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900">{lease.tenant_phone}</p>
              </div>
            </div>
          )}

          {/* Start Date */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Start Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-900">
                {lease.start_date ? formatDate(lease.start_date) : "N/A"}
              </p>
            </div>
          </div>

          {/* End Date */}
          <div>
            <p className="text-xs text-gray-500 mb-1">End Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-900">
                {lease.end_date ? formatDate(lease.end_date) : "N/A"}
              </p>
            </div>
          </div>

          {/* Agreement Document */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Agreement Document</p>
            {hasAgreement ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm transition-colors border border-blue-200"
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
        </div>

        {/* Action Button */}
        <div className="pt-4 sm:pt-6 border-t border-gray-200">
          <button
            onClick={handleViewLease}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-medium text-sm transition-all"
          >
            <Eye className="w-4 h-4" />
            View Full Details
          </button>
        </div>
      </div>
    </div>
  );
}
