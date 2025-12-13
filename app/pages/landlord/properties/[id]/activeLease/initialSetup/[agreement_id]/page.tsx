"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
    FileSignature,
    ClipboardList,
    CreditCard,
    CheckCircle,
    Lock,
} from "lucide-react";

import MoveInModal from "@/components/landlord/activeLease/MoveInModal";

export default function LeaseSetupWizard() {
    const router = useRouter();
    const { id, agreement_id } = useParams();
    const property_id = id as string;

    const [requirements, setRequirements] = useState<any>(null);

    const [documentUploaded, setDocumentUploaded] = useState(false);
    const [moveInDate, setMoveInDate] = useState<string | null>(null);

    const [paymentData, setPaymentData] = useState({
        security_deposit_amount: "",
        security_deposit_months: 1,
        advance_payment_amount: "",
        advance_payment_months: 1,
    });
    const [paymentsSaved, setPaymentsSaved] = useState(false);

    const [moveInModalOpen, setMoveInModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    /* ---------------- LOAD DATA ---------------- */
    useEffect(() => {
        const load = async () => {
            try {
                const reqRes = await axios.get(
                    `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
                );

                const moveInRes = await axios.get(
                    `/api/landlord/activeLease/moveIn?agreement_id=${agreement_id}`
                );

                const payRes = await axios.get(
                    `/api/landlord/activeLease/initialPayments?agreement_id=${agreement_id}`
                );

                setRequirements(reqRes.data.requirements || {});
                setDocumentUploaded(reqRes.data.document_uploaded || false);
                setMoveInDate(moveInRes.data.move_in_date || null);

                setPaymentData({
                    security_deposit_amount:
                        payRes.data?.security_deposit_amount || "",
                    security_deposit_months:
                        payRes.data?.security_deposit_months || 1,
                    advance_payment_amount:
                        payRes.data?.advance_payment_amount || "",
                    advance_payment_months:
                        payRes.data?.advance_payment_months || 1,
                });

                setPaymentsSaved(!!payRes.data?.saved);
                setLoading(false);
            } catch (err) {
                console.error("❌ Failed to load lease setup:", err);
            }
        };

        load();
    }, [agreement_id]);

    if (loading || !requirements) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading lease setup...
            </div>
        );
    }

    /* ---------------- COMPLETION ---------------- */
    const paymentsRequired =
        requirements.security_deposit || requirements.advance_payment;

    const allComplete =
        (!requirements.lease_agreement || documentUploaded) &&
        (!requirements.move_in_checklist || !!moveInDate) &&
        (!paymentsRequired || paymentsSaved);

    /* ---------------- SAVE PAYMENTS ---------------- */
    const savePayments = async () => {
        try {
            await axios.post(`/api/landlord/activeLease/initialPayments`, {
                agreement_id,
                ...paymentData,
            });
            setPaymentsSaved(true);
        } catch (e) {
            console.error("❌ Failed to save payments", e);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg space-y-5">

                {/* HEADER */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Lease Setup</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Agreement ID: {agreement_id}
                    </p>
                </div>

                {/* STEP 1 */}
                {requirements.lease_agreement && (
                    <StepCard
                        title="Step 1: Lease Agreement"
                        completed={documentUploaded}
                        icon={<FileSignature />}
                        description={
                            documentUploaded
                                ? "✓ Completed"
                                : "Upload and finalize the lease agreement."
                        }
                        action={
                            !documentUploaded && (
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/pages/landlord/properties/${property_id}/activeLease/setup?agreement_id=${agreement_id}`
                                        )
                                    }
                                    className="primary-btn"
                                >
                                    Start Lease Agreement
                                </button>
                            )
                        }
                    />
                )}

                {/* STEP 2 */}
                {requirements.move_in_checklist && (
                    <StepCard
                        title="Step 2: Move-In Date"
                        completed={!!moveInDate}
                        locked={!documentUploaded}
                        icon={<ClipboardList />}
                        description={
                            !documentUploaded
                                ? "Complete Step 1 to unlock."
                                : moveInDate
                                    ? `✓ ${moveInDate}`
                                    : "Click to set move-in date."
                        }
                        onClick={() => documentUploaded && setMoveInModalOpen(true)}
                    />
                )}

                {moveInModalOpen && (
                    <MoveInModal
                        agreement_id={agreement_id}
                        defaultDate={moveInDate}
                        onClose={() => setMoveInModalOpen(false)}
                        onSaved={(date: string) => setMoveInDate(date)}
                    />
                )}

                {/* STEP 3 — PAYMENTS */}
                {(requirements.security_deposit || requirements.advance_payment) && (
                    <div
                        className={`bg-white p-5 rounded-2xl border shadow-sm ${
                            paymentsSaved ? "border-green-400" : "border-gray-200"
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">
                                Step 3: Initial Payments
                            </h2>
                        </div>

                        <div className="space-y-4">

                            {requirements.security_deposit && (
                                <PaymentInput
                                    label="Security Deposit"
                                    amount={paymentData.security_deposit_amount}
                                    months={paymentData.security_deposit_months}
                                    onAmountChange={(v) =>
                                        setPaymentData((p) => ({
                                            ...p,
                                            security_deposit_amount: v,
                                        }))
                                    }
                                    onMonthsChange={(v) =>
                                        setPaymentData((p) => ({
                                            ...p,
                                            security_deposit_months: v,
                                        }))
                                    }
                                />
                            )}

                            {requirements.advance_payment && (
                                <PaymentInput
                                    label="Advance Payment"
                                    amount={paymentData.advance_payment_amount}
                                    months={paymentData.advance_payment_months}
                                    onAmountChange={(v) =>
                                        setPaymentData((p) => ({
                                            ...p,
                                            advance_payment_amount: v,
                                        }))
                                    }
                                    onMonthsChange={(v) =>
                                        setPaymentData((p) => ({
                                            ...p,
                                            advance_payment_months: v,
                                        }))
                                    }
                                />
                            )}
                        </div>

                        <button
                            onClick={savePayments}
                            className="w-full mt-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Save Payments
                        </button>
                    </div>
                )}

                {/* COMPLETE */}
                {allComplete && (
                    <div className="bg-green-50 p-5 rounded-2xl border border-green-400 text-center">
                        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                        <h2 className="font-semibold text-green-700 text-lg">
                            Lease Setup Complete
                        </h2>

                        <button
                            onClick={() =>
                                router.push(
                                    `/pages/landlord/properties/${property_id}/activeLease`
                                )
                            }
                            className="w-full mt-4 py-2.5 rounded-xl bg-green-600 text-white"
                        >
                            Back to Active Leases
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function StepCard({
                      title,
                      description,
                      completed,
                      locked,
                      icon,
                      action,
                      onClick,
                  }: any) {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-5 rounded-2xl border shadow-sm transition ${
                completed
                    ? "border-green-400"
                    : locked
                        ? "opacity-60"
                        : "hover:shadow-md border-gray-200"
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
                <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{title}</h2>
                    <p className="text-xs text-gray-500">{description}</p>
                </div>
                {locked && <Lock className="w-4 h-4 text-gray-400" />}
            </div>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

function PaymentInput({
                          label,
                          amount,
                          months,
                          onAmountChange,
                          onMonthsChange,
                      }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} Amount
            </label>
            <input
                type="number"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
                Months Covered
            </label>
            <input
                type="number"
                min="1"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={months}
                onChange={(e) => onMonthsChange(Number(e.target.value))}
            />
        </div>
    );
}
