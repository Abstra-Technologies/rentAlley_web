"use client";

import { useState } from "react";
import VerificationLayout from "./VerificationLayout";
import StepSelfie from "@/components/landlord/verifiication/StepSelfie";
import StepID from "@/components/landlord/verifiication/StepID";


export default function LandlordVerificationPage() {
    const [step, setStep] = useState(1);

    const [idImage, setIdImage] = useState<File | null>(null);
    const [selfieImage, setSelfieImage] = useState<File | null>(null);
    const [idType, setIdType] = useState("");


    const handleSubmit = async () => {
        if (!idImage || !selfieImage) return;

        const formData = new FormData();
        formData.append("id", idImage);
        formData.append("selfie", selfieImage);

        await fetch("/api/landlord/verification", {
            method: "POST",
            body: formData,
        });
    };

    return (
        <VerificationLayout
            currentStep={step}
            totalSteps={2}
            onBack={() => setStep((s) => Math.max(1, s - 1))}
            onNext={() => {
                if (step === 2) {
                    handleSubmit();
                } else {
                    setStep((s) => Math.min(2, s + 1));
                }
            }}
            canProceed={
                (step === 1 && !!idImage && !!idType) ||
                (step === 2 && !!selfieImage)
            }
        >
            {step === 1 && (
                <StepID
                    value={idImage}
                    idType={idType}
                    onChange={setIdImage}
                    onIdTypeChange={setIdType}
                />            )}

            {step === 2 && (
                <StepSelfie value={selfieImage} onChange={setSelfieImage} />
            )}
        </VerificationLayout>
    );
}
