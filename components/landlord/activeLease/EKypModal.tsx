"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Shield,
  User,
  Building2,
  Home,
  CheckCircle,
  XCircle,
  Loader2,
  QrCode,
} from "lucide-react";

interface Props {
  open: boolean;
  lease: any | null;
  onClose: () => void;
}

type EkypStatus = "draft" | "active" | "revoked";

export default function EKypModal({ open, lease, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<EkypStatus>("draft");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  /* ===============================
     Fetch eKYP status + QR from backend
  ================================ */
  useEffect(() => {
    if (!open || !lease?.lease_id) return;

    const fetchStatus = async () => {
      try {
        setFetching(true);

        const res = await axios.get("/api/landlord/activeLease/ekypId/status", {
          params: { agreement_id: lease.lease_id },
        });

        setStatus(res.data?.status || "draft");
        setQrUrl(res.data?.qr_url || null);
      } catch {
        setStatus("draft");
        setQrUrl(null);
      } finally {
        setFetching(false);
      }
    };

    fetchStatus();
  }, [open, lease]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !lease) return null;

  const isActive = status === "active";
  const isDraft = status === "draft";
  const isRevoked = status === "revoked";

  const statusConfig = {
    draft: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: "Draft",
      icon: QrCode,
    },
    active: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Active",
      icon: CheckCircle,
    },
    revoked: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Revoked",
      icon: XCircle,
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  /* ===============================
     ACTIONS
  ================================ */
  const activateId = async () => {
    try {
      setLoading(true);

      await axios.post("/api/landlord/activeLease/ekypId/activate", {
        agreement_id: lease.lease_id,
      });

      // Refetch to get new QR
      const res = await axios.get("/api/landlord/activeLease/ekypId/status", {
        params: { agreement_id: lease.lease_id },
      });

      setStatus("active");
      setQrUrl(res.data?.qr_url || null);

      Swal.fire({
        icon: "success",
        title: "eKYP Activated",
        text: "Tenant ID is now active and verifiable.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Failed to activate eKYP ID.", "error");
    } finally {
      setLoading(false);
    }
  };

  const revokeId = async () => {
    const confirm = await Swal.fire({
      title: "Revoke eKYP ID?",
      text: "This ID will no longer be valid for verification.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, revoke it",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      await axios.post("/api/landlord/activeLease/ekypId/revoke", {
        agreement_id: lease.lease_id,
      });

      setStatus("revoked");
      setQrUrl(null);

      Swal.fire({
        icon: "success",
        title: "eKYP Revoked",
        text: "The tenant ID has been revoked.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Failed to revoke eKYP ID.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Slide up on mobile, centered on desktop */}
      <div
        className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl
                   max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300
                   safe-area-bottom"
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          {/* Mobile drag indicator */}
          <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Tenant eKYP ID
                </h2>
                <p className="text-xs text-gray-500">
                  Digital identity verification
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors -mr-1"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="px-5 py-5 overflow-y-auto flex-1">
          {/* QR Code Section */}
          <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 mb-5">
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${currentStatus.bg} ${currentStatus.text}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {currentStatus.label}
              </span>
            </div>

            {/* QR Display */}
            <div className="flex justify-center">
              <div
                className={`relative transition-all duration-300 ${
                  isActive && qrUrl && !fetching
                    ? ""
                    : "blur-md opacity-50 pointer-events-none"
                }`}
              >
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Tenant eKYP QR"
                    className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-48 sm:h-48 bg-gray-200 rounded-xl flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Overlay Message */}
              {(fetching || !isActive) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="px-4 py-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg text-center max-w-[200px]">
                    {fetching && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking status...
                      </div>
                    )}
                    {!fetching && isDraft && (
                      <p className="text-sm text-gray-600">
                        Activate the ID to enable QR verification
                      </p>
                    )}
                    {!fetching && isRevoked && (
                      <p className="text-sm text-red-600">
                        This ID has been revoked
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            <InfoRow
              icon={<User className="w-4 h-4 text-blue-600" />}
              label="Tenant"
              value={lease.tenant_name}
            />
            <InfoRow
              icon={<Home className="w-4 h-4 text-emerald-600" />}
              label="Unit"
              value={lease.unit_name}
            />
            <InfoRow
              icon={<Building2 className="w-4 h-4 text-amber-600" />}
              label="Property"
              value={lease.property_name}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={loading || isActive}
              onClick={activateId}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                loading || isActive
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Activate ID
            </button>

            <button
              disabled={loading || !isActive}
              onClick={revokeId}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                loading || !isActive
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Revoke ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Info Row Component
================================ */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[150px] truncate">
        {value || "—"}
      </span>
    </div>
  );
}
