"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

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

                const res = await axios.get(
                    "/api/landlord/activeLease/ekypId/status",
                    {
                        params: { agreement_id: lease.lease_id },
                    }
                );

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

    if (!open || !lease) return null;

    const isActive = status === "active";
    const isDraft = status === "draft";
    const isRevoked = status === "revoked";

    /* ===============================
       ACTIONS
    ================================ */

    const activateId = async () => {
        try {
            setLoading(true);

            await axios.post("/api/landlord/activeLease/ekypId/activate", {
                agreement_id: lease.lease_id,
            });

            setStatus("active");

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
            text: "This ID will no longer be valid.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h2 className="text-sm font-semibold">Tenant eKYP Identification</h2>
                    <button onClick={onClose}>
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* QR from backend */}
                    <div className="relative flex justify-center bg-gray-50 rounded-xl p-4">
                        <div
                            className={`transition-all duration-300
                                ${isActive && qrUrl && !fetching
                                ? ""
                                : "blur-sm opacity-60 pointer-events-none"}
                            `}
                        >
                            {qrUrl ? (
                                <img
                                    src={qrUrl}
                                    alt="Tenant eKYP QR"
                                    className="w-[180px] h-[180px]"
                                />
                            ) : (
                                <div className="w-[180px] h-[180px] bg-gray-200 rounded-md" />
                            )}
                        </div>

                        {(fetching || !isActive) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="px-4 py-2 text-xs font-semibold bg-white border rounded-lg shadow">
                                    {fetching && "Checking ID status…"}
                                    {isDraft && "Activate ID to enable QR"}
                                    {isRevoked && "ID has been revoked"}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                        <Info label="Tenant" value={lease.tenant_name} />
                        <Info label="Unit" value={lease.unit_name} />
                        <Info label="Property" value={lease.property_name} />
                        <Info label="ID Status" value={status.toUpperCase()} />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex gap-2">
                    <button
                        disabled={loading || isActive}
                        onClick={activateId}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md disabled:bg-gray-200"
                    >
                        Activate ID
                    </button>

                    <button
                        disabled={loading || !isActive}
                        onClick={revokeId}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-200"
                    >
                        Revoke ID
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ===============================
   Info Row
================================ */
function Info({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium">{value || "—"}</span>
        </div>
    );
}
