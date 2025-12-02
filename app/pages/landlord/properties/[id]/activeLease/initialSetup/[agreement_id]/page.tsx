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

import MoveInModal from "@/components/landlord/activeLease/MoveInModal";

export default function LeaseSetupWizard() {
    const router = useRouter();
    const { id, agreement_id } = useParams();
    const property_id = id;

    const [requirements, setRequirements] = useState(null);

    const [documentUploaded, setDocumentUploaded] = useState(false);
    const [moveInDate, setMoveInDate] = useState(null);
    const moveInSet = !!moveInDate;

    const [moveInModalOpen, setMoveInModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch checklist requirements + lease agreement status
                const reqRes = await axios.get(
                    `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
                );

                // Fetch move-in date from LeaseAgreement
                const moveInRes = await axios.get(
                    `/api/landlord/activeLease/moveIn?agreement_id=${agreement_id}`
                );

                setRequirements(reqRes.data.requirements || {});
                setDocumentUploaded(reqRes.data.document_uploaded || false);
                setMoveInDate(moveInRes.data.move_in_date || null);

                setLoading(false);
            } catch (err) {
                console.error("❌ Failed to load:", err);
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

    // 🔍 Check if ALL REQUIRED STEPS are completed
    const paymentsRequired =
        requirements.security_deposit || requirements.advance_payment;

    const allComplete =
        documentUploaded &&
        moveInSet &&
        (!paymentsRequired || true); // payments not yet implemented; default true

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg">

                {/* HEADER */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Lease Setup
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Agreement ID: {agreement_id}</p>
                </div>

                {/* STEPS */}
                <div className="space-y-5">

                    {/* STEP 1 — Lease Agreement */}
                    {requirements.lease_agreement && (
                        <div
                            className={`bg-white p-5 rounded-2xl border shadow-sm transition 
                                ${documentUploaded ? "border-green-400" : "border-gray-200 hover:shadow-md"}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50">
                                    <FileSignature
                                        className={`w-5 h-5 ${documentUploaded ? "text-green-600" : "text-blue-600"}`}
                                    />
                                </div>

                                <div>
                                    <h2
                                        className={`font-semibold ${
                                            documentUploaded ? "text-green-700" : "text-gray-900"
                                        }`}
                                    >
                                        Step 1: Lease Agreement
                                    </h2>

                                    {!documentUploaded ? (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Prepare and review the rental contract.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-green-600 mt-0.5">
                                            ✓ Completed — proceed to next step.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Button only if incomplete */}
                            {!documentUploaded && (
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
                                    Start Lease Agreement
                                </button>
                            )}
                        </div>
                    )}

                    {/* STEP 2 — Move-In Date */}
                    {requirements.move_in_checklist && (
                        <div
                            className={`bg-white p-5 rounded-2xl border shadow-sm transition 
                                ${documentUploaded ? "cursor-pointer hover:shadow-lg" : "cursor-default opacity-60"}
                                ${moveInSet ? "border-green-400" : "border-gray-200"}
                            `}
                            onClick={() => {
                                if (!documentUploaded) return;
                                setMoveInModalOpen(true);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <ClipboardList
                                        className={`w-5 h-5 ${
                                            documentUploaded
                                                ? moveInSet
                                                    ? "text-green-600"
                                                    : "text-blue-600"
                                                : "text-gray-400"
                                        }`}
                                    />
                                </div>

                                <div className="flex-1">
                                    <h2
                                        className={`font-semibold ${
                                            moveInSet
                                                ? "text-green-700"
                                                : documentUploaded
                                                    ? "text-blue-700"
                                                    : "text-gray-700"
                                        }`}
                                    >
                                        Step 2: Move-In Date
                                    </h2>

                                    {!documentUploaded ? (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Complete Step 1 to unlock.
                                        </p>
                                    ) : moveInSet ? (
                                        <p className="text-xs text-green-600 mt-0.5">
                                            ✓ Move-in date set — proceed to next step.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-blue-600 mt-0.5">
                                            Set the move-in date.
                                        </p>
                                    )}
                                </div>

                                {!documentUploaded && <Lock className="w-4 h-4 text-gray-400" />}
                            </div>
                        </div>
                    )}

                    {/* Move-In Modal */}
                    {moveInModalOpen && (
                        <MoveInModal
                            agreement_id={agreement_id}
                            defaultDate={moveInDate}
                            onClose={() => setMoveInModalOpen(false)}
                            onSaved={(date) => {
                                setMoveInDate(date);
                            }}
                        />
                    )}

                    {/* STEP 3 — Initial Payments (If Required) */}
                    {(requirements.security_deposit || requirements.advance_payment) && (
                        <div
                            className={`bg-white p-5 rounded-2xl border shadow-sm transition
                                ${
                                moveInSet
                                    ? "opacity-100 cursor-pointer hover:shadow-md border-blue-400"
                                    : "opacity-60 cursor-default border-gray-200"
                            }
                            `}
                            onClick={() => {
                                if (moveInSet) {
                                    router.push(
                                        `/pages/landlord/properties/${property_id}/activeLease/setup/payments?agreement_id=${agreement_id}`
                                    );
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <CreditCard
                                        className={`w-5 h-5 ${
                                            moveInSet ? "text-blue-600" : "text-gray-400"
                                        }`}
                                    />
                                </div>

                                <div className="flex-1">
                                    <h2
                                        className={`font-semibold ${
                                            moveInSet ? "text-blue-700" : "text-gray-700"
                                        }`}
                                    >
                                        Step 3: Initial Payments
                                    </h2>

                                    {!moveInSet ? (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Set move-in date to unlock.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-blue-600 mt-0.5">
                                            Ready to proceed.
                                        </p>
                                    )}
                                </div>

                                {!moveInSet && <Lock className="w-4 h-4 text-gray-400" />}
                            </div>
                        </div>
                    )}

                    {/* FINAL SECTION — All Completed */}
                    {allComplete && (
                        <div className="bg-green-50 p-5 rounded-2xl border border-green-400 shadow-sm text-center">
                            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                            <h2 className="text-green-700 font-semibold text-lg">
                                Lease Setup Complete!
                            </h2>
                            <p className="text-sm text-green-600 mt-1">
                                All required steps have been finished.
                            </p>

                            <button
                                onClick={() =>
                                    router.push(
                                        `/pages/landlord/properties/${property_id}/activeLease`
                                    )
                                }
                                className="
                                    w-full mt-4 py-2.5 rounded-xl
                                    bg-green-600 text-white text-sm font-medium
                                    hover:bg-green-700 active:scale-[0.98]
                                    transition-all
                                "
                            >
                                Back to Active Leases
                            </button>
                        </div>
                    )}

                    {/* Reminder if not complete */}
                    {!allComplete && (
                        <p className="text-xs text-gray-400 text-center mt-6">
                            Complete all required steps to finish the setup.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
