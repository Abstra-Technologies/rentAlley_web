"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Swal from "sweetalert2";
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Wallet,
    FileText,
    Home,
    X,
} from "lucide-react";

import useSubscription from "@/hooks/landlord/useSubscription";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
import PlatformAgreementModal from "@/components/landlord/platformAgreement/PlatformAgreementModal";

type VerificationStatus = "incomplete" | "pending" | "rejected" | "verified";

interface Props {
    landlordId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LandlordOnboarding({ landlordId }: Props) {
    const router = useRouter();

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showAgreementModal, setShowAgreementModal] = useState(false);

    const [payoutMethod, setPayoutMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    const { subscription } = useSubscription(landlordId);

    const { data: verification } = useSWR(
        landlordId ? `/api/landlord/${landlordId}/profileStatus` : null,
        fetcher
    );

    const { data: payoutRes, mutate } = useSWR(
        landlordId ? `/api/landlord/payout/${landlordId}` : null,
        fetcher
    );

    const { data: agreementRes, mutate: mutateAgreement } = useSWR(
        landlordId
            ? `/api/landlord/platformAgreement/${landlordId}`
            : null,
        fetcher
    );

    const { data: propertiesRes } = useSWR(
        landlordId
            ? `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`
            : null,
        fetcher
    );

    if (!verification || !payoutRes || !agreementRes) return null;

    const agreementDone = agreementRes.accepted === true;
    const verificationStatus: VerificationStatus =
        verification.status ?? "incomplete";
    const verificationDone = verificationStatus === "verified";
    const payoutDone = payoutRes.status === "completed";
    const hasProperty =
        Array.isArray(propertiesRes) && propertiesRes.length > 0;

    const allCompleted =
        agreementDone && verificationDone && payoutDone && hasProperty;

    // ✅ Hide onboarding if everything completed
    if (allCompleted) return null;

    const completedSteps =
        (agreementDone ? 1 : 0) +
        (verificationDone ? 1 : 0) +
        (payoutDone ? 1 : 0) +
        (hasProperty ? 1 : 0);

    const nextStep =
        !agreementDone
            ? "agreement"
            : !verificationDone
                ? "verification"
                : !payoutDone
                    ? "payout"
                    : "property";

    const isFullyVerified =
        agreementDone && verificationDone && payoutDone;

    const handleCreateProperty = () => {
        if (!isFullyVerified) {
            Swal.fire(
                "Complete Setup First",
                "Please complete all required steps before adding a property.",
                "warning"
            );
            return;
        }

        if (!subscription || subscription.is_active !== 1) {
            Swal.fire({
                title: "Subscription Required",
                text: "You need an active subscription to add properties.",
                icon: "info",
                confirmButtonText: "View Plans",
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push("/pages/landlord/subsciption_plan/pricing");
                }
            });
            return;
        }

        router.push("/pages/landlord/property-listing/create-property");
    };

    return (
        <>
            {/* 🔵 OUTER WRAPPER WITH BG + HOVER */}
            <div className="mb-6 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 p-1 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
                <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Welcome to Upkyp 👋
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Complete the steps below to start receiving rent.
                                </p>
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                                {completedSteps} of 4 steps completed
                            </div>
                        </div>

                        <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                                style={{ width: `${(completedSteps / 4) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StepCard
                            title="Accept Platform Terms"
                            description={
                                agreementDone
                                    ? "Completed"
                                    : "Read and accept our terms"
                            }
                            icon={<FileText className="h-5 w-5" />}
                            status={agreementDone ? "done" : "start"}
                            isNext={nextStep === "agreement"}
                            onClick={() => setShowAgreementModal(true)}
                        />

                        <StepCard
                            title="Verify Your Identity"
                            description={getVerificationText(verificationStatus)}
                            icon={getVerificationIcon(verificationStatus)}
                            status={
                                verificationDone
                                    ? "done"
                                    : verificationStatus === "pending"
                                        ? "pending"
                                        : "start"
                            }
                            isNext={nextStep === "verification"}
                            onClick={() =>
                                !verificationDone &&
                                (window.location.href =
                                    "/pages/landlord/verification")
                            }
                        />

                        <StepCard
                            title="Set Up Your Bank Account"
                            description={
                                payoutDone
                                    ? "Completed"
                                    : "Add your bank details to receive rent"
                            }
                            icon={<Wallet className="h-5 w-5" />}
                            status={payoutDone ? "done" : "start"}
                            isNext={nextStep === "payout"}
                            onClick={() => setShowPayoutModal(true)}
                        />

                        <StepCard
                            title="Add Your First Property"
                            description={
                                hasProperty
                                    ? "Completed"
                                    : isFullyVerified
                                        ? "Add your rental property"
                                        : "Complete setup first"
                            }
                            icon={<Home className="h-5 w-5" />}
                            status={hasProperty ? "done" : "start"}
                            disabled={!isFullyVerified && !hasProperty}
                            isNext={nextStep === "property"}
                            onClick={!hasProperty ? handleCreateProperty : undefined}
                        />
                    </div>
                </div>
            </div>

            {/* Agreement Modal */}
            {showAgreementModal && (
                <PlatformAgreementModal
                    landlordId={landlordId}
                    onClose={() => setShowAgreementModal(false)}
                    onAccepted={() => mutateAgreement()}
                />
            )}

            {/* Bank Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h3 className="text-lg font-bold">
                                Add Your Bank Details
                            </h3>
                            <button onClick={() => setShowPayoutModal(false)}>
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="px-6 py-6">
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
                                    mutate();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* STEP CARD */

function StepCard({
                      title,
                      description,
                      icon,
                      status,
                      onClick,
                      isNext,
                      disabled,
                  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    status: "done" | "pending" | "start";
    onClick?: () => void;
    isNext?: boolean;
    disabled?: boolean;
}) {
    const styles = {
        done: "border-green-300 bg-green-50",
        pending: "border-yellow-300 bg-yellow-50",
        start: "border-gray-200 bg-white hover:border-blue-300",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                styles[status]
            } ${isNext ? "ring-2 ring-blue-500" : ""} ${
                disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-md"
            }`}
        >
            {isNext && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
          Next Step
        </span>
            )}

            <div className="flex items-start gap-4">
                <div className="rounded-xl bg-white p-2 shadow-sm">
                    {icon}
                </div>
                <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
}

/* UTILITIES */

function getVerificationText(status: VerificationStatus) {
    switch (status) {
        case "pending":
            return "We are reviewing your documents";
        case "rejected":
            return "Please re-upload your ID";
        case "verified":
            return "Verified ✔";
        default:
            return "Upload your ID to protect your account";
    }
}

function getVerificationIcon(status: VerificationStatus) {
    switch (status) {
        case "verified":
            return <CheckCircle className="h-5 w-5 text-green-600" />;
        case "pending":
            return <Clock className="h-5 w-5 text-yellow-600" />;
        default:
            return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
}