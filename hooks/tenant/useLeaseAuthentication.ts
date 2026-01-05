"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export function useLeaseAuthentication(agreement_id?: string) {
    const [loading, setLoading] = useState(true);
    const [signature, setSignature] = useState<any>(null);
    const [otpSent, setOtpSent] = useState(false);
    const [verifying, setVerifying] = useState(false);

    /* ================= LOAD SIGNATURE ================= */
    useEffect(() => {
        if (!agreement_id) return;

        let mounted = true;

        async function loadSignature() {
            try {
                const res = await axios.get(
                    "/api/tenant/activeRent/leaseAgreement/signatureStatus",
                    { params: { agreement_id } }
                );

                console.log('lease data for sign: ', res.data);

                if (!mounted) return;

                setSignature(res.data?.tenant_signature ?? null);
            } catch {
                Swal.fire("Error", "Failed to load lease signature status.", "error");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadSignature();
        return () => {
            mounted = false;
        };
    }, [agreement_id]);

    /* ================= DERIVED STATE ================= */
    const hasSignatureRecord = Boolean(signature);
    const isSigned = signature?.status === "signed";
    const needsSignature = hasSignatureRecord && !isSigned;

    /* ================= ACTIONS ================= */
    const sendOtp = async () => {
        if (!agreement_id || !signature?.email) return;

        try {
            await axios.post("/api/tenant/activeRent/leaseAgreement/sendOtp", {
                agreement_id,
                email: signature.email,
                role: "tenant",
            });

            setOtpSent(true);
            Swal.fire("OTP Sent", "Check your email for the code.", "success");
        } catch (err: any) {
            Swal.fire(
                "Error",
                err.response?.data?.error || "Failed to send OTP",
                "error"
            );
        }
    };

    const verifyOtp = async (otpCode: string) => {
        if (!agreement_id || !signature?.email) return false;

        try {
            setVerifying(true);

            const res = await axios.post(
                "/api/tenant/activeRent/leaseAgreement/verifyOtp",
                {
                    agreement_id,
                    email: signature.email,
                    otp_code: otpCode,
                    role: "tenant",
                }
            );

            if (res.data?.success) {
                Swal.fire("Success", "Lease signed successfully.", "success");
                setSignature({ ...signature, status: "signed" });
                return true;
            }

            Swal.fire("Error", res.data?.error || "Invalid OTP", "error");
            return false;
        } finally {
            setVerifying(false);
        }
    };

    return {
        loading,
        signature,
        isSigned,
        needsSignature,
        otpSent,
        verifying,
        sendOtp,
        verifyOtp,
    };
}
