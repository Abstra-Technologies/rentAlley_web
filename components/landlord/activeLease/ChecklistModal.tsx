"use client";

import { FileSignature } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface Props {
    lease: any; // contains lease_id
    onClose: () => void;
    onContinue: (requirements: any) => void;
}

export default function ChecklistSetupModal({ lease, onClose, onContinue }: Props) {
    const agreement_id = lease.lease_id; // 🔥 correct FK from your API

    const [requirements, setRequirements] = useState({
        lease_agreement: true,
        move_in_checklist: true,
        security_deposit: false,
        advance_payment: false,
        other_essential: false,
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // =======================================================
    //  Auto-load existing checklist if record exists (GET)
    // =======================================================
    useEffect(() => {
        const loadChecklist = async () => {
            try {
                const res = await axios.get(
                    `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
                );

                if (res.data?.requirements) {
                    setRequirements({
                        lease_agreement: res.data.requirements.lease_agreement === 1,
                        move_in_checklist: res.data.requirements.move_in_checklist === 1,
                        security_deposit: res.data.requirements.security_deposit === 1,
                        advance_payment: res.data.requirements.advance_payment === 1,
                        other_essential: res.data.requirements.other_essential === 1,
                    });
                }
            } catch (e) {
                console.warn("No existing checklist found.");
            }
        };

        loadChecklist();
    }, [agreement_id]);

    // =======================================================
    // 🔥 Save checklist (POST if new, PUT if exists)
    // =======================================================
    const handleSave = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            // check if checklist exists
            const existing = await axios.get(
                `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
            );

            const doesExist = existing.data?.requirements;

            if (doesExist) {
                // UPDATE
                await axios.put("/api/landlord/activeLease/saveChecklistRequirements", {
                    agreement_id,
                    ...requirements
                });
            } else {
                // CREATE
                await axios.post("/api/landlord/activeLease/saveChecklistRequirements", {
                    agreement_id,
                    ...requirements
                });
            }

            setLoading(false);
            onContinue(requirements);
        } catch (error: any) {
            console.error("Error saving checklist:", error);
            setLoading(false);
            setErrorMessage("Failed to save checklist. Please try again.");
        }
    };

    const toggle = (key: string) => {
        setRequirements((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

                {/* HEADER */}
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-blue-600" />
                    Lease Setup Requirements
                </h2>

                <p className="text-sm text-gray-600 mb-4">
                    Select the initial requirements you want to prepare for this lease.
                </p>

                {/* ERROR MESSAGE */}
                {errorMessage && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                {/* CHECKBOXES */}
                <div className="space-y-4">
                    {[
                        ["lease_agreement", "Lease Agreement"],
                        ["move_in_checklist", "Move-in Checklist"],
                        ["security_deposit", "Security Deposit Payment"],
                        ["advance_payment", "Advance Payment"],
                        ["other_essential", "Other Essential Documents"],
                    ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={requirements[key]}
                                onChange={() => toggle(key)}
                                disabled={loading}
                            />
                            <span className="text-sm text-gray-800">{label}</span>
                        </label>
                    ))}
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg shadow hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Continue"}
                    </button>
                </div>

            </div>
        </div>
    );
}
