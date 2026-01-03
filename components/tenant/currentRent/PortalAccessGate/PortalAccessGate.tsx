"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    LockClosedIcon,
} from "@heroicons/react/24/outline";

type GateStatus = {
    allowed: boolean;
    reasons: string[];
};

export default function PortalAccessGate({
                                             agreementId,
                                         }: {
    agreementId?: string;
}) {
    const [status, setStatus] = useState<GateStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!agreementId) return;

        const cacheKey = `portal_access_ok_${agreementId}`;

        // ✅ FAST PATH — already unlocked this session
        if (sessionStorage.getItem(cacheKey) === "true") {
            setStatus({ allowed: true, reasons: [] });
            setLoading(false);
            return;
        }

        let mounted = true;

        async function checkGate() {
            try {
                const res = await axios.get(
                    `/api/tenant/activeRent/access-check?agreement_id=${agreementId}`
                );

                if (!mounted) return;

                setStatus(res.data);
                if (res.data?.allowed === true) {
                    sessionStorage.setItem(cacheKey, "true");
                }
            } catch (err) {
                console.error("Portal gate check failed:", err);
                if (mounted) {
                    setStatus({
                        allowed: false,
                        reasons: ["Unable to verify lease requirements"],
                    });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        checkGate();

        return () => {
            mounted = false;
        };
    }, [agreementId]);

    /* -------------------------------------------------
       RENDER LOGIC
    ------------------------------------------------- */

    // ⏭ Already allowed → render nothing
    if (!loading && status?.allowed) return null;

    // ⏳ Only show checking overlay if NOT cached
    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-700">
                    <LockClosedIcon className="w-6 h-6 animate-pulse" />
                    <span className="font-semibold">Checking access requirements…</span>
                </div>
            </div>
        );
    }

    // 🔒 Blocked overlay
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-100">
                        <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                        Action Required
                    </h2>
                </div>

                <p className="text-sm text-gray-600">
                    You need to complete the following before accessing the rental
                    portal:
                </p>

                <ul className="space-y-2">
                    {status?.reasons.map((reason, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-700"
                        >
                            <CheckCircleIcon className="w-4 h-4 text-amber-500 mt-0.5" />
                            {reason}
                        </li>
                    ))}
                </ul>

                <div className="pt-3 text-xs text-gray-500">
                    Once completed, this page will unlock automatically.
                </div>
            </div>
        </div>
    );
}
