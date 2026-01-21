// "use client";
//
// import { useEffect } from "react";
//
// import LoadingScreen from "@/components/loadingScreen";
// import useLandlordVerification from "@/hooks/landlord/useLandlordVerification";
//
// import VerificationLayout from "./VerificationLayout";
//
// import StepPersonalInfo from "@/components/landlord/verifiication/steps/Step1PersonalInfo";
// import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
// import StepDocument from "@/components/landlord/verifiication/steps/Step2Document";
// import StepSelfie from "@/components/landlord/verifiication/steps/Step3Selfie";
//
// const STEP_STORAGE_KEY = "landlord_verification_step";
//
// export default function LandlordVerificationPage() {
//     const verification = useLandlordVerification();
//
//     const {
//         dataLoading,
//         currentStep,
//         setCurrentStep,
//         detectCameraDevices,
//         requestCameraPermission,
//         canProceed,
//         handleSubmit,
//     } = verification;
//
//     useEffect(() => {
//         const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
//         if (savedStep) {
//             const step = Number(savedStep);
//             if (step >= 1 && step <= 4) {
//                 setCurrentStep(step);
//             }
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);
//
//     /* ------------------------------------------------------------
//        SAVE STEP ON CHANGE
//     ------------------------------------------------------------ */
//     useEffect(() => {
//         localStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
//     }, [currentStep]);
//
//     /* ------------------------------------------------------------
//        CAMERA BOOTSTRAP
//        Step 3: Document
//        Step 4: Selfie
//     ------------------------------------------------------------ */
//     useEffect(() => {
//         if (currentStep === 3 || currentStep === 4) {
//             detectCameraDevices();
//             requestCameraPermission();
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [currentStep]);
//
//     if (dataLoading) {
//         return <LoadingScreen message="please wait..." />;
//     }
//
//     return (
//         <VerificationLayout
//             currentStep={currentStep}
//             setCurrentStep={setCurrentStep}
//             canProceed={canProceed}
//             handleSubmit={handleSubmit}
//         >
//             {currentStep === 1 && <StepPersonalInfo {...verification} />}
//
//             {currentStep === 2 && <StepPayoutInfo {...verification} />}
//
//             {currentStep === 3 && <StepDocument {...verification} />}
//
//             {currentStep === 4 && <StepSelfie {...verification} />}
//         </VerificationLayout>
//     );
// }


"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";
import VerificationLayout from "./VerificationLayout";
import { ShieldCheck, ExternalLink } from "lucide-react";

type VerificationStatus =
    | "unverified"
    | "pending"
    | "verified"
    | "failed";

export default function LandlordVerificationPage() {
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [status, setStatus] = useState<VerificationStatus>("unverified");

    /* ------------------------------------------------------------
       FETCH CURRENT VERIFICATION STATUS
    ------------------------------------------------------------ */
    useEffect(() => {
        axios
            .get("/api/landlord/verification/status")
            .then((res) => {
                setStatus(res.data.status);
            })
            .finally(() => setLoading(false));
    }, []);

    /* ------------------------------------------------------------
       START DIDDIT VERIFICATION
    ------------------------------------------------------------ */
    const startVerification = async () => {
        try {
            setStarting(true);

            const res = await axios.post(
                "/api/landlord/verification/start"
            );
            window.location.href = res.data.redirect_url;
        } catch (err) {
            alert("Failed to start verification. Please try again.");
            setStarting(false);
        }
    };

    if (loading) {
        return <LoadingScreen message="Checking verification status..." />;
    }

    return (
        <VerificationLayout
            currentStep={1}
            setCurrentStep={() => {}}
            canProceed={false}
            handleSubmit={() => {}}
        >
            <div className="max-w-xl mx-auto space-y-6 text-center">
                <div className="flex justify-center">
                    <ShieldCheck className="w-14 h-14 text-blue-600" />
                </div>

                {/* VERIFIED */}
                {status === "verified" && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Identity Verified ✅
                        </h2>
                        <p className="text-gray-600">
                            Your identity has been successfully verified.
                            You now have full access to landlord features.
                        </p>
                    </>
                )}

                {/* PENDING */}
                {status === "pending" && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Verification In Progress
                        </h2>
                        <p className="text-gray-600">
                            Your verification is being reviewed.
                            We’ll notify you once it’s completed.
                        </p>
                    </>
                )}

                {/* FAILED */}
                {status === "failed" && (
                    <>
                        <h2 className="text-2xl font-bold text-red-600">
                            Verification Failed
                        </h2>
                        <p className="text-gray-600">
                            We couldn’t verify your identity.
                            Please try again.
                        </p>

                        <button
                            onClick={startVerification}
                            disabled={starting}
                            className="inline-flex items-center gap-2
                px-6 py-3 rounded-xl font-semibold
                bg-red-600 text-white hover:bg-red-700"
                        >
                            Retry Verification
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </>
                )}

                {/* UNVERIFIED */}
                {status === "unverified" && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Verify Your Identity
                        </h2>
                        <p className="text-gray-600">
                            To protect tenants and comply with regulations,
                            we require identity verification via DIDDIT.
                        </p>

                        <button
                            onClick={startVerification}
                            disabled={starting}
                            className="inline-flex items-center gap-2
                px-6 py-3 rounded-xl font-semibold
                bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {starting ? "Redirecting..." : "Start Verification"}
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </VerificationLayout>
    );
}
