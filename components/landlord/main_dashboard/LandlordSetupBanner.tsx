"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Swal from "sweetalert2";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Wallet,
  XCircle,
  FileText,
  Home,
  X,
} from "lucide-react";

import useSubscription from "@/hooks/landlord/useSubscription";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
import PlatformAgreementModal from "@/components/landlord/platformAgreement/PlatformAgreementModal";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */

type VerificationStatus = "incomplete" | "pending" | "rejected" | "verified";
type PayoutStatus = "pending" | "completed";

interface Props {
  landlordId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/* -------------------------------------------------------------------------- */
/* MAIN */
/* -------------------------------------------------------------------------- */

export default function LandlordSetupBanner({ landlordId }: Props) {
  const router = useRouter();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const [payoutMethod, setPayoutMethod] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  // ── Subscription (needed to gate create property) ──
  const { subscription } = useSubscription(landlordId);

  const { data: verification } = useSWR(
    landlordId ? `/api/landlord/${landlordId}/profileStatus` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: payoutRes, mutate } = useSWR(
    landlordId ? `/api/landlord/payout/${landlordId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: agreementRes, mutate: mutateAgreement } = useSWR(
    landlordId ? `/api/landlord/platformAgreement/${landlordId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  // ✅ Correct endpoint and response shape (plain array)
  const { data: propertiesRes } = useSWR(
    landlordId
      ? `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (!verification || !payoutRes || !agreementRes) return null;
  if (payoutRes.setup_completed === 1 && agreementRes.accepted) return null;

  const agreementDone = agreementRes.accepted === true;
  const verificationStatus: VerificationStatus =
    verification.status ?? "incomplete";
  const payoutStatus: PayoutStatus =
    payoutRes.status === "completed" ? "completed" : "pending";
  const verificationDone = verificationStatus === "verified";
  const payoutDone = payoutStatus === "completed";

  // ✅ Plain array response
  const hasProperty = Array.isArray(propertiesRes) && propertiesRes.length > 0;

  if (agreementDone && verificationDone && payoutDone) return null;

  const activationPercent =
    (agreementDone ? 33 : 0) +
    (verificationDone ? 33 : 0) +
    (payoutDone ? 34 : 0);

  // ── Validated navigation — same guards as usePropertyListingPage ──
  const handleCreateProperty = () => {
    if (verificationStatus !== "verified") {
      Swal.fire(
        "Verification Required",
        "Please verify your identity first before adding a property.",
        "warning",
      );
      return;
    }

    if (!subscription || subscription.is_active !== 1) {
      Swal.fire({
        title: "Subscription Required",
        text: "You need an active subscription to add properties.",
        icon: "info",
        confirmButtonText: "View Plans",
        showCancelButton: true,
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
      <div
        id="dashboard-setup-banner"
        className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Account Activation
              </h2>
              <p className="text-sm text-gray-500">
                Complete required steps to enable payouts
              </p>
            </div>
            <div className="text-sm font-medium text-gray-600">
              {activationPercent}% Complete
            </div>
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${activationPercent}%` }}
            />
          </div>
        </div>

        {/* Steps — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* STEP 1 - PLATFORM AGREEMENT */}
          <StepCard
            title="Platform Agreement"
            description={
              agreementDone ? "Completed" : "Review & accept agreement"
            }
            status={agreementDone ? "completed" : "pending"}
            icon={<FileText className="h-5 w-5" />}
            disabled={agreementDone}
            onClick={() => setShowAgreementModal(true)}
          />

          {/* STEP 2 - IDENTITY VERIFICATION */}
          <StepCard
            title="Identity Verification"
            description={getVerificationText(verificationStatus)}
            status={verificationStatus}
            icon={getVerificationIcon(verificationStatus)}
            disabled={verificationDone}
            onClick={
              verificationDone
                ? undefined
                : () => (window.location.href = "/pages/landlord/verification")
            }
          />

          {/* STEP 3 - CONNECT BANK */}
          <StepCard
            title="Connect Bank"
            description={
              payoutDone
                ? "Completed"
                : "Set up payout method to received directly into your account"
            }
            status={payoutDone ? "completed" : "pending"}
            icon={<Wallet className="h-5 w-5" />}
            disabled={false}
            onClick={() => setShowPayoutModal(true)}
          />

          {/* STEP 4 - CREATE FIRST PROPERTY (Optional) */}
          <StepCard
            title="Create First Property"
            description={
              hasProperty ? "Completed" : "List your first rental property"
            }
            status={hasProperty ? "completed" : "incomplete"}
            icon={<Home className="h-5 w-5" />}
            disabled={hasProperty}
            isOptional={!hasProperty}
            onClick={hasProperty ? undefined : handleCreateProperty}
          />
        </div>
      </div>

      {/* AGREEMENT MODAL */}
      {showAgreementModal && (
        <PlatformAgreementModal
          landlordId={landlordId}
          onClose={() => setShowAgreementModal(false)}
          onAccepted={() => mutateAgreement()}
        />
      )}

      {/* PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-gray-800">
                Payout Information
              </h3>
              <button onClick={() => setShowPayoutModal(false)}>
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
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

/* -------------------------------------------------------------------------- */
/* STEP CARD */
/* -------------------------------------------------------------------------- */

function StepCard({
  title,
  description,
  icon,
  status,
  disabled = false,
  isOptional = false,
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
  isOptional?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    verified: "border-green-300 bg-green-50 text-green-700",
    completed: "border-green-300 bg-green-50 text-green-700",
    pending: "border-orange-300 bg-orange-50 text-orange-700",
    rejected: "border-red-300 bg-red-50 text-red-700",
    incomplete: "border-blue-300 bg-blue-50 text-blue-700",
    locked: "border-gray-200 bg-gray-100 text-gray-400",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`relative w-full rounded-2xl border p-5 text-left transition ${
        styles[status]
      } ${
        disabled
          ? "cursor-not-allowed opacity-80"
          : "hover:shadow-md active:scale-[0.99]"
      }`}
    >
      {/* Optional badge */}
      {isOptional && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 text-blue-500 border border-blue-200">
          Optional
        </span>
      )}

      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-white p-2 shadow-sm">{icon}</div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs opacity-80 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* UTILITIES */
/* -------------------------------------------------------------------------- */

function getVerificationText(status: VerificationStatus) {
  switch (status) {
    case "pending":
      return "Under review";
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
