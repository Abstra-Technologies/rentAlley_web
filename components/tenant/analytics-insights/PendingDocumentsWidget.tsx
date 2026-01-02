"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    XMarkIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ClockIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/zustand/authStore";
import { formatCurrency } from "@/utils/formatter/formatters";

interface Props {
    agreement_id: string;
    showPendingLeaseInfo?: boolean; // 🔑 NEW FLAG
}

export default function TenantLeaseModal({
                                             agreement_id,
                                             showPendingLeaseInfo = true, // default ON
                                         }: Props) {
    const { user, fetchSession } = useAuthStore();

    const [lease, setLease] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [openModal, setOpenModal] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [verifying, setVerifying] = useState(false);

    /* ================= AUTH ================= */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* ================= OTP COOLDOWN ================= */
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    /* ================= LOAD LEASE ================= */
    useEffect(() => {
        async function loadLease() {
            try {
                const res = await axios.get(
                    `/api/tenant/activeRent/leaseAgreement/signatureStatus`,
                    { params: { agreement_id } }
                );

                const data = res.data;
                setLease({ ...data, ...data.lease });
            } catch {
                Swal.fire("Error", "Failed to load lease information.", "error");
            } finally {
                setLoading(false);
            }
        }
        loadLease();
    }, [agreement_id]);

    if (loading) {
        return <p className="text-sm text-gray-500">Loading lease information…</p>;
    }

    if (!lease) {
        return <p className="text-sm text-gray-500">Lease not found.</p>;
    }

    const hasLeaseAgreement = Boolean(lease.agreement_url);
    const sig = lease.tenant_signature;
    const alreadySigned = sig?.status === "signed";

    const needsTenantSignature =
        hasLeaseAgreement && sig && sig.status !== "signed";

    /* ================= OTP ACTIONS ================= */
    const sendOtp = async () => {
        try {
            await axios.post(`/api/tenant/activeRent/leaseAgreement/sendOtp`, {
                agreement_id,
                email: sig?.email,
                role: "tenant",
            });
            setOtpSent(true);
            Swal.fire(
                "OTP Sent",
                "Check your email for the verification code.",
                "success"
            );
        } catch (err: any) {
            Swal.fire(
                "Error",
                err.response?.data?.error || "Failed to send OTP",
                "error"
            );
        }
    };

    const verifyOtp = async () => {
        try {
            setVerifying(true);
            const res = await axios.post(
                `/api/tenant/activeRent/leaseAgreement/verifyOtp`,
                {
                    agreement_id,
                    email: sig?.email,
                    otp_code: otpCode,
                    role: "tenant",
                }
            );

            if (res.data?.success) {
                Swal.fire("Success", "Lease signed successfully.", "success");
                setOpenModal(false);
            } else {
                Swal.fire("Error", res.data?.error || "Invalid OTP", "error");
            }
        } finally {
            setVerifying(false);
        }
    };

    /* ======================== UI ============================== */

    return (
        <>
            <div className="space-y-4">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-bold text-gray-900">
                            Lease Information
                        </span>
                    </div>

                    <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold border ${
                            !hasLeaseAgreement
                                ? "bg-gray-100 text-gray-600 border-gray-200"
                                : alreadySigned
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                    >
                        {!hasLeaseAgreement
                            ? "No Document"
                            : alreadySigned
                                ? "Signed"
                                : "Pending Signature"}
                    </span>
                </div>

                {/* 🔑 CONTROLLED BLOCK */}
                {showPendingLeaseInfo && !hasLeaseAgreement && (
                    <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <LeaseRow
                            label="Monthly Rent"
                            value={formatCurrency(lease.rent_amount || 0)}
                        />
                        <LeaseRow
                            label="Security Deposit"
                            value={formatCurrency(
                                lease.security_deposit_amount || 0
                            )}
                        />
                        <LeaseRow
                            label="Advance Payment"
                            value={formatCurrency(
                                lease.advance_payment_amount || 0
                            )}
                        />
                        <p className="text-xs text-gray-600">
                            Your landlord has not uploaded the lease document yet.
                        </p>
                    </div>
                )}

                {/* ================= LEASE DOCUMENT EXISTS ================= */}
                {hasLeaseAgreement && (
                    <>
                        <button
                            onClick={() => setOpenModal(true)}
                            className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition text-sm font-semibold text-blue-600 w-full"
                        >
                            <DocumentTextIcon className="w-4 h-4" />
                            {alreadySigned
                                ? "View Signed Lease"
                                : "View Lease"}
                        </button>

                        {needsTenantSignature && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <ClockIcon className="w-4 h-4 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900">
                                        Signature Required
                                    </p>
                                    <p className="text-xs text-amber-700">
                                        Please authenticate to sign your lease
                                        agreement.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!needsTenantSignature && alreadySigned && (
                            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <CheckCircleIcon className="w-4 h-4 text-emerald-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-900">
                                        Lease Signed
                                    </p>
                                    <p className="text-xs text-emerald-700">
                                        Your lease agreement is fully signed.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ================= MODAL ================= */}
            {openModal && hasLeaseAgreement && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-lg overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                                Lease Agreement
                            </h2>
                            <button onClick={() => setOpenModal(false)}>
                                <XMarkIcon className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                            <iframe
                                src={lease.agreement_url}
                                className="w-full h-[420px] rounded-lg border"
                            />

                            {needsTenantSignature && (
                                <div className="space-y-4">
                                    {!otpSent ? (
                                        <button
                                            onClick={sendOtp}
                                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold"
                                        >
                                            Authenticate & Sign Lease
                                        </button>
                                    ) : (
                                        <>
                                            <input
                                                value={otpCode}
                                                onChange={(e) =>
                                                    setOtpCode(e.target.value)
                                                }
                                                maxLength={6}
                                                className="w-full border p-3 rounded-lg text-center text-xl tracking-[0.3em]"
                                                placeholder="••••••"
                                            />

                                            <button
                                                onClick={verifyOtp}
                                                disabled={verifying}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-lg"
                                            >
                                                {verifying
                                                    ? "Verifying…"
                                                    : "Verify & Sign"}
                                            </button>

                                            <button
                                                onClick={sendOtp}
                                                disabled={cooldown > 0}
                                                className="text-sm text-blue-600"
                                            >
                                                {cooldown > 0
                                                    ? `Resend in ${cooldown}s`
                                                    : "Resend OTP"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ================= SMALL UI ================= */
function LeaseRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-sm text-gray-700">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
        </div>
    );
}
