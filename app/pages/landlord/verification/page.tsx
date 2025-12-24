"use client";

import { useEffect } from "react";

import LoadingScreen from "@/components/loadingScreen";
import useLandlordVerification from "@/hooks/landlord/useLandlordVerification";

import VerificationLayout from "./VerificationLayout";

import StepPersonalInfo from "@/components/landlord/verifiication/steps/Step1PersonalInfo";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
import StepDocument from "@/components/landlord/verifiication/steps/Step2Document";
import StepSelfie from "@/components/landlord/verifiication/steps/Step3Selfie";

const STEP_STORAGE_KEY = "landlord_verification_step";

export default function LandlordVerificationPage() {
    const verification = useLandlordVerification();

    const {
        dataLoading,
        currentStep,
        setCurrentStep,
        detectCameraDevices,
        requestCameraPermission,
        canProceed,
        handleSubmit,
    } = verification;

    /* ------------------------------------------------------------
       RESTORE STEP ON PAGE LOAD
    ------------------------------------------------------------ */
    useEffect(() => {
        const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
        if (savedStep) {
            const step = Number(savedStep);
            if (step >= 1 && step <= 4) {
                setCurrentStep(step);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ------------------------------------------------------------
       SAVE STEP ON CHANGE
    ------------------------------------------------------------ */
    useEffect(() => {
        localStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
    }, [currentStep]);

    /* ------------------------------------------------------------
       CAMERA BOOTSTRAP
       Step 3: Document
       Step 4: Selfie
    ------------------------------------------------------------ */
    useEffect(() => {
        if (currentStep === 3 || currentStep === 4) {
            detectCameraDevices();
            requestCameraPermission();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep]);

    if (dataLoading) {
        return <LoadingScreen message="please wait..." />;
    }

    return (
        <VerificationLayout
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            canProceed={canProceed}
            handleSubmit={handleSubmit}
        >
            {currentStep === 1 && <StepPersonalInfo {...verification} />}

            {currentStep === 2 && <StepPayoutInfo {...verification} />}

            {currentStep === 3 && <StepDocument {...verification} />}

            {currentStep === 4 && <StepSelfie {...verification} />}
        </VerificationLayout>
    );
}
