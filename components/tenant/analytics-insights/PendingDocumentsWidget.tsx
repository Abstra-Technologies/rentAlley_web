"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/zustand/authStore";

export default function TenantLeaseModal({
  agreement_id,
}: {
  agreement_id: string;
}) {
  const { user, fetchSession } = useAuthStore();
  const [leaseData, setLeaseData] = useState<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 🔹 Fetch lease + signature status
  useEffect(() => {
    async function fetchLease() {
      try {
        const res = await axios.get(
          `/api/tenant/activeRent/leaseAgreement/signatureStatus?agreement_id=${agreement_id}`
        );
        setLeaseData(res.data);
      } catch (err) {
        console.error("❌ Failed to load lease info:", err);
      } finally {
        setLoading(false);
      }
    }
    if (agreement_id) fetchLease();
  }, [agreement_id]);

  // 🔹 Send OTP to tenant email
  const handleSendOtp = async () => {
    try {
      await axios.post("/api/tenant/activeRent/leaseAgreement/sendOtp", {
        agreement_id,
        role: "tenant",
        email: leaseData?.tenant_signature?.email,
      });
      setOtpSent(true);
      Swal.fire(
        "OTP Sent!",
        "Check your email for the 6-digit code.",
        "success"
      );
    } catch (err: any) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to send OTP.",
        "error"
      );
    }
  };

  // 🔹 Verify OTP and mark as signed
  const handleVerifyOtp = async () => {
    try {
      setVerifying(true);
      const payload = {
        agreement_id,
        email: leaseData?.tenant_signature?.email,
        role: "tenant",
        otp_code: otpCode,
      };
      const res = await axios.post(
        "/api/tenant/activeRent/leaseAgreement/verifyOtp",
        payload
      );

      if (res.data?.success) {
        Swal.fire({
          title: "Lease Signed!",
          text: "You have successfully signed the lease agreement.",
          icon: "success",
          confirmButtonColor: "#059669",
        });
        // Refresh the lease data to show updated signature status
        const refreshed = await axios.get(
          `/api/tenant/activeRent/leaseAgreement/signatureStatus?agreement_id=${agreement_id}`
        );
        setLeaseData(refreshed.data);
        setOtpSent(false);
      } else {
        Swal.fire("Error", res.data?.error || "Invalid OTP.", "error");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Swal.fire("Error", "Failed to verify OTP.", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    try {
      const res = await axios.post(
        `/api/tenant/activeRent/leaseAgreement/sendOtp`,
        {
          agreement_id,
          role: "tenant",
          email: leaseData?.tenant_signature?.email,
        }
      );
      if (res.data?.success) {
        Swal.fire({
          title: "OTP Resent!",
          text: "A new verification code was sent to your email.",
          icon: "success",
          confirmButtonColor: "#059669",
        });
        setCooldown(60);
      }
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to resend OTP.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-28 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const tenantSignature = leaseData?.tenant_signature || {};
  const isTenant = user?.userType === "tenant";
  const hasSignatureRecord = !!tenantSignature?.id;
  const isSigned = tenantSignature.status === "signed";
  const isPending = tenantSignature.status === "pending";

  return (
    <div className="space-y-4">
      {/* Header - Matching other widgets */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isSigned
                ? "bg-emerald-100"
                : isPending
                ? "bg-amber-100"
                : "bg-blue-100"
            }`}
          >
            <DocumentTextIcon
              className={`w-4 h-4 ${
                isSigned
                  ? "text-emerald-600"
                  : isPending
                  ? "text-amber-600"
                  : "text-blue-600"
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Lease Agreement</h3>
            <p className="text-xs text-gray-600">
              Digital signature & verification
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${
            leaseData?.agreement_status === "active"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-blue-100 text-blue-700 border-blue-200"
          }`}
        >
          {leaseData?.agreement_status || "pending"}
        </span>
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Property
          </p>
          <p className="text-sm font-bold text-gray-900">
            {leaseData?.property_name || "N/A"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Unit
          </p>
          <p className="text-sm font-bold text-gray-900">
            {leaseData?.unit_name || "N/A"}
          </p>
        </div>
      </div>

      {/* Lease Document Link */}
      {leaseData?.agreement_url && (
        <a
          href={leaseData.agreement_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-sm font-semibold text-blue-600"
        >
          <DocumentTextIcon className="w-4 h-4" />
          View Full Lease Agreement
        </a>
      )}

      {/* Signature Status */}
      {hasSignatureRecord && (
        <>
          <div
            className={`rounded-lg border p-4 ${
              isSigned
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <div
                className={`p-1.5 rounded-lg ${
                  isSigned ? "bg-emerald-100" : "bg-amber-100"
                }`}
              >
                {isSigned ? (
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ClockIcon className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Signature Status
                </p>
                <p className="text-sm font-bold text-gray-900 mb-1">
                  {tenantSignature?.email || "N/A"}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    isSigned
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {tenantSignature.status || "pending"}
                </span>
              </div>
            </div>

            {tenantSignature.signed_at && (
              <div className="mt-2 pt-2 border-t border-emerald-200">
                <p className="text-xs text-gray-600">
                  Signed on{" "}
                  {new Date(tenantSignature.signed_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* OTP Section */}
          {isTenant && isPending && (
            <div className="space-y-3">
              {!otpSent ? (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <ShieldCheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Ready to Sign?
                      </p>
                      <p className="text-xs text-gray-600">
                        We'll send a verification code to your email
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSendOtp}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-emerald-700 transition-all"
                  >
                    Authenticate & Sign Lease
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-blue-200 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900">
                      Enter Verification Code
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    We sent a 6-digit code to{" "}
                    <strong>{tenantSignature?.email}</strong>
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="• • • • • •"
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-center tracking-[0.5em] text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verifying}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-60"
                    >
                      {verifying ? "Verifying..." : "Verify & Sign"}
                    </button>
                    <button
                      onClick={handleResendOtp}
                      disabled={cooldown > 0}
                      className="px-4 py-2.5 text-sm font-semibold rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                    >
                      {cooldown > 0 ? `${cooldown}s` : "Resend"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Status Message - Matching other widgets */}
      {hasSignatureRecord && isSigned && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Fully Signed
            </p>
            <p className="text-xs text-emerald-700">
              Your lease agreement is active
            </p>
          </div>
        </div>
      )}

      {hasSignatureRecord && isPending && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Action Required
            </p>
            <p className="text-xs text-amber-700">
              Please sign your lease agreement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
