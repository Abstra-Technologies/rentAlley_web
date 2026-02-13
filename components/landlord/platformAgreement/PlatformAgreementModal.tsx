"use client";

import { useState } from "react";
import { X } from "lucide-react";
import PlatformAgreementContent from "@/components/landlord/platformAgreement/PlatformAgreementContent";
import Swal from "sweetalert2";

export default function PlatformAgreementModal({
                                                   landlordId,
                                                   onClose,
                                                   onAccepted

                                               }: {
    landlordId: string;
    onClose: () => void;
    onAccepted: () => void;

}) {
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAgree = async () => {
        if (!agreed) return;

        const confirm = await Swal.fire({
            title: "Confirm Agreement",
            text: "By accepting, you agree to be legally bound by the Platform Services Agreement.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Accept",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#2563eb",
        });

        if (!confirm.isConfirmed) return;

        try {
            setLoading(true);

            const res = await fetch(
                `/api/landlord/platformAgreement/${landlordId}`,
                { method: "POST" }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to accept agreement");
            }

            await Swal.fire({
                title: "Agreement Accepted",
                text: "You have successfully accepted the Platform Agreement.",
                icon: "success",
                confirmButtonColor: "#2563eb",
            });
            onAccepted?.();
            onClose();

        } catch (error: any) {
            await Swal.fire({
                title: "Error",
                text: error.message || "Something went wrong.",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">

                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h3 className="font-bold text-lg">
                        Platform Usage Agreement
                    </h3>
                    <button onClick={onClose}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[55vh] overflow-y-auto">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs leading-relaxed text-gray-700 uppercase tracking-wide">
                        PLEASE READ THE FOLLOWING PLATFORM SERVICES AGREEMENT (THE “PLATFORM
                        SERVICES AGREEMENT”), WHICH, ALONG WITH ANY SUPPLEMENTAL TERMS THAT MAY
                        BE PRESENTED FOR REVIEW AND ACCEPTANCE (COLLECTIVELY, THIS
                        “AGREEMENT”), CONSTITUTES A LEGALLY BINDING AGREEMENT BETWEEN THE
                        ENTITY SUBSCRIBING TO USE THE UPKYP PLATFORM (“CUSTOMER”), AND
                        ABSTRA TECHNOLOGIES CORPORATION, A DULY REGISTERED CORPORATION
                        (“ABSTRA”). EACH OF CUSTOMER AND ABSTRA ARE INDIVIDUALLY REFERRED TO
                        HEREIN AS A “PARTY” AND TOGETHER AS THE “PARTIES”.
                    </div>
                    <PlatformAgreementContent />
                </div>


                <div className="p-6 text-sm text-gray-600 space-y-4 max-h-[50vh] overflow-y-auto">
                        <p>
                            By clicking “Agree” or electronically agreeing to this
                            Agreement, you acknowledge that such action constitutes
                            a legally binding agreement.
                        </p>

                </div>

                <div className="border-t px-6 py-4 space-y-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) =>
                                setAgreed(e.target.checked)
                            }
                        />
                        I agree to the Platform Terms & Conditions
                    </label>

                    <button
                        disabled={!agreed || loading}
                        onClick={handleAgree}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50"
                    >
                        {loading ? "Processing..." : "Accept Agreement"}
                    </button>
                </div>
            </div>
        </div>
    );
}
