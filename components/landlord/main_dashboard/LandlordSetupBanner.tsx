"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    CheckCircle,
    AlertCircle,
    Clock,
    Wallet,
    XCircle,
    X,
} from "lucide-react";

import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type VerificationStatus =
    | "incomplete"
    | "pending"
    | "rejected"
    | "verified";

type PayoutStatus = "pending" | "completed";

interface Props {
    landlordId: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Utils                                    */
/* -------------------------------------------------------------------------- */

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */

export default function LandlordSetupBanner({ landlordId }: Props) {
    /* ---------------- Modal State ---------------- */
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    /* ---------------- Payout Form State ---------------- */
    const [payoutMethod, setPayoutMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    /* ---------------- Fetch Verification STATUS ---------------- */
    const { data: verification } = useSWR(
        landlordId ? `/api/landlord/${landlordId}/profileStatus` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    /* ---------------- Fetch Payout STATUS + setup_completed ---------------- */
    const { data: payoutRes, mutate } = useSWR(
        landlordId ? `/api/landlord/payout/${landlordId}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    /* ---------------- Guard ---------------- */
    if (!verification || !payoutRes) {
        return null;
    }

    /* ---------------------------------------------------------------------- */
    /* 🔒 PERMANENT HIDE (HIGHEST PRIORITY)                                     */
    /* ---------------------------------------------------------------------- */
    if (payoutRes.setup_completed === 1) {
        return null;
    }

    /* ---------------- Normalize Status ---------------- */
    const verificationStatus: VerificationStatus =
        verification.status ?? "incomplete";

    const payoutStatus: PayoutStatus =
        payoutRes.status === "completed" ? "completed" : "pending";

    const verificationDone = verificationStatus === "verified";
    const payoutDone = payoutStatus === "completed";

    /* ---------------- Soft hide safety ---------------- */
    if (verificationDone && payoutDone) {
        return null;
    }

    /* ---------------------------------------------------------------------- */
    /*                                Render                                  */
    /* ---------------------------------------------------------------------- */

    return (
        <>
            {/* ================= SETUP BANNER ================= */}
            <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="mb-5">
                    <h2 className="text-lg font-bold text-gray-800">
                        Landlord Setup Progress
                    </h2>
                    <p className="text-sm text-gray-500">
                        Complete the steps below to fully activate your account
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* STEP 1 — VERIFICATION */}
                    <Step
                        title="Verification"
                        description={getVerificationText(verificationStatus)}
                        status={verificationStatus}
                        icon={getVerificationIcon(verificationStatus)}
                        disabled={verificationDone} // 🔥 NO CLICK WHEN VERIFIED
                        onClick={
                            verificationDone
                                ? undefined
                                : () =>
                                    (window.location.href =
                                        "/pages/landlord/verification")
                        }
                    />

                    <Connector active={verificationDone} />

                    {/* STEP 2 — PAYOUT */}
                    <Step
                        title="Payout Setup"
                        description={
                            payoutDone
                                ? "Completed"
                                : verificationDone
                                    ? "Set up your payout method"
                                    : "Locked until verified"
                        }
                        status={
                            !verificationDone
                                ? "locked"
                                : payoutDone
                                    ? "completed"
                                    : "pending"
                        }
                        icon={<Wallet className="h-5 w-5" />}
                        disabled={!verificationDone}
                        onClick={() => setShowPayoutModal(true)}
                    />
                </div>
            </div>

            {/* ================= PAYOUT MODAL ================= */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Set Up Payout Information
                            </h3>
                            <button onClick={() => setShowPayoutModal(false)}>
                                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <StepPayoutInfo
                                landlordId={landlordId}
                                payoutMethod={payoutMethod}
                                setPayoutMethod={setPayoutMethod}
                                accountName={accountName}
                                setAccountName={setAccountName}
                                accountNumber={accountNumber}
                                setAccountNumber={setAccountNumber}
                                bankName={bankName}
                                setBankName={setBankName}
                                onSaved={() => {
                                    setShowPayoutModal(false);
                                    mutate(); // refresh payout status + setup_completed
                                }}
                            />
                        </div>

                        <div className="flex justify-end border-t px-6 py-4">
                            <button
                                onClick={() => setShowPayoutModal(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*                               Helper Components                             */
/* -------------------------------------------------------------------------- */

function Step({
                  title,
                  description,
                  icon,
                  status,
                  disabled = false,
                  onClick,
              }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    status:
        | "incomplete"
        | "pending"
        | "rejected"
        | "verified"
        | "completed"
        | "locked";
    disabled?: boolean;
    onClick?: () => void;
}) {
    const styles = {
        verified: "text-green-600 bg-green-50 border-green-300",
        completed: "text-green-600 bg-green-50 border-green-300",
        pending: "text-orange-600 bg-orange-50 border-orange-300",
        rejected: "text-red-600 bg-red-50 border-red-300",
        incomplete: "text-blue-600 bg-blue-50 border-blue-300",
        locked: "text-gray-400 bg-gray-100 border-gray-200",
    };

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex-1 rounded-xl border p-4 text-left transition ${
                styles[status]
            } ${
                disabled
                    ? "cursor-not-allowed opacity-70"
                    : "hover:shadow-md active:scale-[0.99]"
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 shadow-sm">{icon}</div>
                <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs opacity-80">{description}</p>
                </div>
            </div>
        </button>
    );
}

function Connector({ active }: { active: boolean }) {
    return (
        <div className="hidden sm:flex flex-1 items-center">
            <div
                className={`h-[2px] w-full ${
                    active ? "bg-green-400" : "bg-gray-300"
                }`}
            />
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                              Status Utilities                               */
/* -------------------------------------------------------------------------- */

function getVerificationText(status: VerificationStatus) {
    switch (status) {
        case "pending":
            return "In review";
        case "rejected":
            return "Action required";
        case "verified":
            return "Completed";
        default:
            return "Verify your identity";
    }
}

function getVerificationIcon(status: VerificationStatus) {
    switch (status) {
        case "verified":
            return <CheckCircle className="h-5 w-5" />;
        case "rejected":
            return <XCircle className="h-5 w-5" />;
        case "pending":
            return <Clock className="h-5 w-5" />;
        default:
            return <AlertCircle className="h-5 w-5" />;
    }
}
