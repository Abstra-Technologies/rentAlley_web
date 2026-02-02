"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    XMarkIcon,
    DocumentTextIcon,
    ClockIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/zustand/authStore";
import { formatCurrency } from "@/utils/formatter/formatters";

interface Props {
    agreement_id: string;
}

export default function TenantLeaseModal({ agreement_id }: Props) {
    const { user, fetchSession } = useAuthStore();

    const [lease, setLease] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [openModal, setOpenModal] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    useEffect(() => {
        async function loadLease() {
            try {
                const res = await axios.get(
                    "/api/tenant/activeRent/leaseAgreement/signatureStatus",
                    { params: { agreement_id } }
                );
                const data = res.data;
                setLease({ ...data, ...data.lease });
                console.log('lease doc: ', data);

            } catch {
                Swal.fire("Error", "Failed to load lease information.", "error");
            } finally {
                setLoading(false);
            }
        }

        loadLease();
    }, [agreement_id]);

    if (loading) {
        return <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />;
    }

    if (!lease) return null;

    const signature = lease.tenant_signature ?? null;
    const hasSignatureRecord = Boolean(signature);
    const isSigned = signature?.status === "signed";
    const needsSignature = hasSignatureRecord && !isSigned;

    const showAuthenticateUI = needsSignature;
    const showLeaseInfo = !hasSignatureRecord || isSigned;
    const showDocumentButton = Boolean(lease.agreement_url);

    /* ================= OTP ================= */
    const sendOtp = async () => {
        try {
            await axios.post("/api/tenant/activeRent/leaseAgreement/sendOtp", {
                agreement_id,
                email: signature?.email,
                role: "tenant",
            });

            setOtpSent(true);
            Swal.fire("OTP Sent", "Check your email for the code.", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to send OTP", "error");
        }
    };

    const verifyOtp = async () => {
        try {
            setVerifying(true);

            const res = await axios.post(
                "/api/tenant/activeRent/leaseAgreement/verifyOtp",
                {
                    agreement_id,
                    email: signature?.email,
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

    return (
        <>
            {/* ================= CARD ================= */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100">
                            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">
                                Lease Agreement
                            </p>
                            <p className="text-xs text-gray-500">
                                Contract details
                            </p>
                        </div>
                    </div>

                    {(isSigned || needsSignature) && (
                        <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                isSigned
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                        >
        {isSigned ? "Signed" : "Signature Required"}
    </span>
                    )}

                </div>

                {/* Signature CTA */}
                {showAuthenticateUI && (
                    <button
                        onClick={() => setOpenModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                        bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold
                        hover:from-blue-700 hover:to-blue-800 transition"
                    >
                        <ShieldCheckIcon className="w-5 h-5" />
                        Authenticate & Sign Lease
                    </button>
                )}

                {/* Lease Info */}
                {showLeaseInfo && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <LeaseInfoCard
                            label="Monthly Rent"
                            value={formatCurrency(lease.rent_amount || 0)}
                        />
                        <LeaseInfoCard
                            label="Security Deposit"
                            value={formatCurrency(lease.security_deposit_amount || 0)}
                        />
                        <LeaseInfoCard
                            label="Advance Payment"
                            value={formatCurrency(lease.advance_payment_amount || 0)}
                        />
                    </div>
                )}

                {/* View Document */}
                {Boolean(lease.agreement_url) && (
                    <button
                        onClick={() => setOpenModal(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        <DocumentTextIcon className="w-4 h-4" />
                        {isSigned ? "View Signed Lease" : "View Lease Document"}
                    </button>
                )}

            </div>

            {/* ================= MODAL ================= */}
            {openModal && Boolean(lease.agreement_url) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                                Lease Agreement
                            </h2>
                            <button onClick={() => setOpenModal(false)}>
                                <XMarkIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <iframe
                                src={lease.agreement_url}
                                className="w-full h-[420px] rounded-lg border"
                            />

                            {needsSignature && (
                                <div className="space-y-4">
                                    {!otpSent ? (
                                        <button
                                            onClick={sendOtp}
                                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
                                        >
                                            Send OTP
                                        </button>
                                    ) : (
                                        <>
                                            <input
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                maxLength={6}
                                                className="w-full border p-3 rounded-xl text-center text-xl tracking-[0.3em]"
                                                placeholder="••••••"
                                            />

                                            <button
                                                onClick={verifyOtp}
                                                disabled={verifying}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold"
                                            >
                                                {verifying ? "Verifying…" : "Verify & Sign"}
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

/* ================= SMALL CARD ================= */
function LeaseInfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-bold text-gray-900">{value}</p>
        </div>
    );
}
