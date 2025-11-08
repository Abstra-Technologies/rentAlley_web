"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import useAuthStore from "@/zustand/authStore";

export default function TenantLeaseModal({ agreement_id }: { agreement_id: string }) {
    const { user, fetchSession } = useAuthStore(); // ✅ detect user type (tenant/landlord)
    const [leaseData, setLeaseData] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cooldown, setCooldown] = useState(0);
    // 🧭 Ensure session is loaded
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    // ⏳ OTP cooldown timer
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
            Swal.fire("OTP Sent!", "Check your email for the 6-digit code.", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to send OTP.", "error");
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
            const res = await axios.post("/api/tenant/activeRent/leaseAgreement/verifyOtp", payload);

            if (res.data?.success) {
                Swal.fire({
                    title: "Lease Signed!",
                    text: "You have successfully signed the lease agreement.",
                    icon: "success",
                    confirmButtonColor: "#059669",
                });
                setShowModal(false);
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
            const res = await axios.post(`/api/tenant/activeRent/leaseAgreement/sendOtp`, {
                agreement_id,
                role: "tenant",
                email: leaseData?.tenant_signature?.email,
            });
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
            Swal.fire("Error", error.response?.data?.error || "Failed to resend OTP.", "error");
        }
    };

    if (loading) return <p className="text-gray-500">Loading lease info...</p>;

    const tenantSignature = leaseData?.tenant_signature || {};
    const isTenant = user?.userType === "tenant";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-6 sm:p-8 w-full max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-4 border-b border-gray-200 pb-3 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    🧾 Lease Agreement
                </h2>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        leaseData?.agreement_status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                >
          {leaseData?.agreement_status || "pending"}
        </span>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
                <p>
                    <strong>Property:</strong> {leaseData?.property_name}
                </p>
                <p>
                    <strong>Unit:</strong> {leaseData?.unit_name}
                </p>
            </div>

            {/* View Link */}
            {leaseData?.agreement_url && (
                <div className="mb-4">
                    <a
                        href={leaseData.agreement_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                    >
                        📄 View Full Lease Agreement
                    </a>
                </div>
            )}

            {/* Signature Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">
                    Tenant Signature Details
                </h3>
                <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {tenantSignature?.email || "N/A"}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                    <strong>Status:</strong>{" "}
                    <span
                        className={`font-bold ${
                            tenantSignature.status === "signed"
                                ? "text-emerald-600"
                                : tenantSignature.status === "pending"
                                    ? "text-amber-500"
                                    : "text-gray-500"
                        }`}
                    >
            {tenantSignature.status || "pending"}
          </span>
                </p>

                {tenantSignature.signed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                        Signed on{" "}
                        {new Date(tenantSignature.signed_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                )}
            </div>

            {/* 🔐 OTP Section */}
            {isTenant && tenantSignature.status === "pending" && (
                <div className="mt-6 space-y-3">
                    {!otpSent ? (
                        <button
                            onClick={handleSendOtp}
                            className="w-full px-5 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold text-base hover:from-blue-700 hover:to-emerald-700 transition-all"
                        >
                            Authenticate & Sign Lease
                        </button>
                    ) : (
                        <>
                            <input
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                className="w-full border border-gray-300 rounded-lg p-4 text-center tracking-widest text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />

                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={verifying}
                                    className="flex-1 mb-2 sm:mb-0 px-5 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60"
                                >
                                    {verifying ? "Verifying..." : "Verify & Sign"}
                                </button>

                                <button
                                    onClick={handleResendOtp}
                                    disabled={cooldown > 0}
                                    className="w-full sm:w-auto px-4 py-4 text-sm font-semibold rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                                >
                                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
