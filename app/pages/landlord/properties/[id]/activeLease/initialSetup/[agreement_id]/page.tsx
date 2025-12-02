"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
    FileSignature,
    ClipboardList,
    CreditCard,
    CheckCircle,
    Lock
} from "lucide-react";

export default function LeaseSetupWizard() {
    const router = useRouter();
    const { id, agreement_id } = useParams();

    const property_id = id;

    const [requirements, setRequirements] = useState(null);
    const [documentUploaded, setDocumentUploaded] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const reqRes = await axios.get(
                    `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
                );

                setRequirements(reqRes.data.requirements || {});
                setDocumentUploaded(reqRes.data.document_uploaded || false);

                setLoading(false);
            } catch (err) {
                console.error("❌ Failed to load:", err);
                router.replace(`/pages/landlord/properties/${property_id}/activeLease`);
            }
        };

        load();
    }, [agreement_id, property_id, router]);

    if (loading || !requirements) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading setup...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg">

                {/* HEADER */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Lease Setup
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Agreement ID: {agreement_id}
                    </p>
                </div>

                {/* STEPS */}
                <div className="space-y-5">

                    {/* STEP 1 — Lease Agreement */}
                    {requirements.lease_agreement && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm transition hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50">
                                    <FileSignature className="w-5 h-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Step 1: Lease Agreement
                                    </h2>
                                    {!documentUploaded ? (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Prepare and review the rental contract.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-green-600 mt-0.5">
                                            ✓ Document uploaded — you may continue.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    router.push(
                                        `/pages/landlord/properties/${property_id}/activeLease/setup?agreement_id=${agreement_id}`
                                    )
                                }
                                className="
                                    w-full mt-4 py-2.5 rounded-xl
                                    bg-blue-600 text-white text-sm font-medium
                                    hover:bg-blue-700 active:scale-[0.98]
                                    transition-all
                                "
                            >
                                {!documentUploaded
                                    ? "Start Lease Agreement"
                                    : "Continue Lease Agreement"}
                            </button>
                        </div>
                    )}

                    {/* STEP 2 — Move-in Checklist */}
                    {requirements.move_in_checklist && (
                        <div
                            className={`bg-white p-5 rounded-2xl border border-gray-200 shadow-sm transition 
                                ${documentUploaded ? "opacity-100 hover:shadow-md cursor-pointer" : "opacity-60"}
                            `}
                            onClick={() => {
                                if (documentUploaded) {
                                    router.push(
                                        `/pages/landlord/properties/${property_id}/activeLease/setup/movein?agreement_id=${agreement_id}`
                                    );
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <ClipboardList className={`w-5 h-5 ${documentUploaded ? "text-blue-600" : "text-gray-400"}`} />
                                </div>

                                <div className="flex-1">
                                    <h2 className={`font-semibold ${documentUploaded ? "text-gray-900" : "text-gray-700"}`}>
                                        Step 2: Move-in Checklist
                                    </h2>
                                    {!documentUploaded ? (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Complete Step 1 to unlock.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-green-600 mt-0.5">
                                            ✓ Ready to proceed
                                        </p>
                                    )}
                                </div>

                                {!documentUploaded && <Lock className="w-4 h-4 text-gray-400" />}
                            </div>
                        </div>
                    )}

                    {/* STEP 3 — Initial Payments */}
                    {(requirements.security_deposit || requirements.advance_payment) && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <CreditCard className="w-5 h-5 text-gray-400" />
                                </div>

                                <div className="flex-1">
                                    <h2 className="font-semibold text-gray-700">
                                        Step 3: Initial Payments
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Complete previous steps to unlock.
                                    </p>
                                </div>

                                <Lock className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    )}

                    {/* STEP 4 — Review */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                                <CheckCircle className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-700">
                                    Step 4: Review & Finalize
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Final step after completing all tasks.
                                </p>
                            </div>

                            <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
