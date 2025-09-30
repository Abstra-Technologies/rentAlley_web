
// pages/tenant/leaseAgreement/signed.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/zustand/authStore";

export default function LeaseSignedPage() {
    const router = useRouter();
    const { envelopeId } = router.query;
    const { user, fetchSession } = useAuthStore();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        if (!envelopeId) return;

        const checkStatus = async () => {
            try {
                const res = await fetch("/api/leaseAgreement/markSigned", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ envelopeId, userType: user.userType }),
                });

                const data = await res.json();
                if (res.ok) {
                    setStatus("success");
                    console.log("📜 Lease status:", data);
                } else {
                    setStatus("error");
                    console.error("❌ Status check failed:", data);
                }
            } catch (err) {
                setStatus("error");
                console.error("❌ API error:", err);
            }
        };

        checkStatus();
    }, [envelopeId, user?.userType]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
                {status === "loading" && (
                    <>
                        <h1 className="text-xl font-bold text-gray-700 mb-2">Verifying your lease…</h1>
                        <p className="text-gray-500">Please wait while we confirm the signature.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <h1 className="text-2xl font-bold text-green-600 mb-2">✅ Lease Signed!</h1>
                        <p className="text-gray-600">Envelope ID: {envelopeId}</p>
                        <p className="mt-2 text-gray-500">Your lease agreement has been successfully signed.</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h1 className="text-2xl font-bold text-red-600 mb-2">❌ Error</h1>
                        <p className="text-gray-500">We couldn’t verify your lease status. Please contact support.</p>
                    </>
                )}
            </div>
        </div>
    );
}
