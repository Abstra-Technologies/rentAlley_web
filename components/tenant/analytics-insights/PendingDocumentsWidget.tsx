"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    XMarkIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/zustand/authStore";

export default function TenantLeaseModal({ agreement_id }: { agreement_id: string }) {
    const { user, fetchSession } = useAuthStore();

    const [lease, setLease] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [verifying, setVerifying] = useState(false);

    // ➤ INTERNAL MODAL OPEN STATE
    const [openModal, setOpenModal] = useState(false);

    /** Load tenant session */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    /** Cooldown timer */
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    /** Load lease data */
    useEffect(() => {
        async function loadLease() {
            try {
                const res = await axios.get(
                    `/api/tenant/activeRent/leaseAgreement/signatureStatus?agreement_id=${agreement_id}`
                );
                setLease(res.data);
            } catch (err) {
                Swal.fire("Error", "Failed to load lease information.", "error");
            } finally {
                setLoading(false);
            }
        }
        loadLease();
    }, [agreement_id]);

    const sig = lease?.tenant_signature;
    const alreadySigned = sig?.status === "signed";

    /** SEND OTP */
    const sendOtp = async () => {
        try {
            await axios.post(`/api/tenant/activeRent/leaseAgreement/sendOtp`, {
                agreement_id,
                email: sig?.email,
                role: "tenant",
            });
            setOtpSent(true);
            Swal.fire("Sent!", "Check your email for the OTP.", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to send OTP", "error");
        }
    };

    /** VERIFY OTP */
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
                Swal.fire("Signed!", "Your signature is recorded.", "success");
                setOpenModal(false);
            } else {
                Swal.fire("Error", res.data?.error || "Invalid OTP", "error");
            }
        } finally {
            setVerifying(false);
        }
    };

    /** RESEND OTP */
    const resendOtp = async () => {
        if (cooldown > 0) return;

        try {
            await axios.post(`/api/tenant/activeRent/leaseAgreement/sendOtp`, {
                agreement_id,
                email: sig?.email,
                role: "tenant",
            });
            setCooldown(60);
            Swal.fire("Resent!", "Check your email again.", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to resend OTP", "error");
        }
    };

    if (loading) return <p className="text-gray-500">Loading...</p>;

    return (
        <>
            {/* NORMAL CARD (OUTSIDE MODAL) */}
            <div className="space-y-4">

                {/* Header + Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon
                            className={`w-5 h-5 ${
                                alreadySigned ? "text-emerald-600" : "text-blue-600"
                            }`}
                        />
                        <span className="text-sm font-bold text-gray-900">
                Lease Agreement
            </span>
                    </div>

                    {/* Status Badge */}
                    <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold border ${
                            alreadySigned
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                    >
            {alreadySigned ? "Signed" : "Pending"}
        </span>
                </div>

                {/* Lease Document Button */}
                {lease?.agreement_url && (
                    <button
                        onClick={() => setOpenModal(true)}
                        className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition text-sm font-semibold text-blue-600 w-full"
                    >
                        <DocumentTextIcon className="w-4 h-4" />
                        {alreadySigned ? "View Signed Lease" : "View Lease & Sign"}
                    </button>
                )}

                {/* Status Message Below Button */}
                {!alreadySigned ? (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900">
                                Action Required
                            </p>
                            <p className="text-xs text-amber-700">
                                You still need to sign your lease agreement
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-900">
                                Lease Signed
                            </p>
                            <p className="text-xs text-emerald-700">
                                Your lease agreement is fully signed
                            </p>
                        </div>
                    </div>
                )}

            </div>


            {/* ================================
          MODAL SECTION (INTERNAL)
      ================================= */}
            {openModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-lg overflow-hidden flex flex-col">

                        {/* HEADER */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                Lease Agreement
                            </h2>
                            <button onClick={() => setOpenModal(false)}>
                                <XMarkIcon className="w-6 h-6 text-gray-600 hover:text-gray-900" />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="overflow-y-auto p-4">

                            {/* GRID LAYOUT — 1 column on mobile, 2 columns on md+ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* LEFT: PDF VIEWER */}
                                <div className="w-full">
                                    <iframe
                                        src={lease.agreement_url}
                                        className="w-full h-[400px] md:h-[500px] rounded-lg border shadow-sm"
                                    />
                                </div>

                                {/* RIGHT: SIGNING PANEL */}
                                <div className="space-y-6">

                                    {!alreadySigned ? (
                                        <>
                                            {!otpSent ? (
                                                <button
                                                    onClick={sendOtp}
                                                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                                                >
                                                    Authenticate & Sign Lease
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="text-sm text-gray-700">
                                                        Enter the 6-digit code sent to <strong>{sig?.email}</strong>
                                                    </p>

                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value)}
                                                        className="w-full border p-3 rounded-lg text-center text-xl tracking-[0.3em]"
                                                        placeholder="••••••"
                                                    />

                                                    <div className="flex flex-col md:flex-row gap-3">
                                                        <button
                                                            onClick={verifyOtp}
                                                            disabled={verifying}
                                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                                        >
                                                            {verifying ? "Verifying…" : "Verify & Sign"}
                                                        </button>

                                                        <button
                                                            onClick={resendOtp}
                                                            disabled={cooldown > 0}
                                                            className="px-4 py-3 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                                                        >
                                                            {cooldown > 0 ? `${cooldown}s` : "Resend"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2">
                                            <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                                            <p className="text-emerald-900 font-medium">
                                                You have already signed this lease.
                                            </p>
                                        </div>
                                    )}

                                </div>
                            </div>

                        </div>

                        {/* FOOTER */}
                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => setOpenModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </>
    );
}
