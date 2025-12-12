"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

// ------------------------------------------------------------
// IMAGE QUALITY CHECKER
// ------------------------------------------------------------
export const checkImageQuality = (imageData: string) => {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            // brightness
            let brightness = 0;
            for (let i = 0; i < data.length; i += 4)
                brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;

            const avgBrightness = brightness / (data.length / 4);

            // blur detection (variance of Laplacian)
            const gray = [];
            for (let i = 0; i < data.length; i += 4)
                gray.push((data[i] + data[i + 1] + data[i + 2]) / 3);

            let lapVar = 0;
            const w = canvas.width;
            const h = canvas.height;

            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = y * w + x;
                    const lap =
                        Math.abs(
                            4 * gray[idx] -
                            gray[idx - 1] -
                            gray[idx + 1] -
                            gray[idx - w] -
                            gray[idx + w]
                        );
                    lapVar += lap * lap;
                }
            }

            lapVar /= (w - 2) * (h - 2);

            resolve({
                brightness: avgBrightness,
                sharpness: lapVar,
                isBlurry: lapVar < 100,
                isTooDark: avgBrightness < 50,
                isTooLight: avgBrightness > 200,
            });
        };

        img.src = imageData;
    });
};

// ------------------------------------------------------------
// MAIN HOOK
// ------------------------------------------------------------
export default function useLandlordVerification() {
    const router = useRouter();
    const { user } = useAuthStore();

    // ------------------------------------------------------------
    // PERSONAL INFO
    // ------------------------------------------------------------
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [civilStatus, setCivilStatus] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [address, setAddress] = useState("");
    const [citizenship, setCitizenship] = useState("");
    const [occupation, setOccupation] = useState("");
    const [landlordId, setLandlordId] = useState<string | null>(null);

    // ------------------------------------------------------------
    // PAYOUT INFO (NEW)
    // ------------------------------------------------------------
    const [payoutMethod, setPayoutMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    // ------------------------------------------------------------
    // DOCUMENT & SELFIE
    // ------------------------------------------------------------
    const [selectedDocument, setSelectedDocument] = useState("");
    const [uploadOption, setUploadOption] = useState("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [capturedDocument, setCapturedDocument] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);

    // ------------------------------------------------------------
    // CAMERA & QUALITY
    // ------------------------------------------------------------
    const webcamRef = useRef<any>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraAllowed, setCameraAllowed] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [hasCamera, setHasCamera] = useState(true);

    const [imageQuality, setImageQuality] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [captureGuidance, setCaptureGuidance] = useState("");
    const [captureCountdown, setCaptureCountdown] = useState(0);

    // ------------------------------------------------------------
    // STEP & SUGGESTIONS
    // ------------------------------------------------------------
    const [currentStep, setCurrentStep] = useState(1);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // ------------------------------------------------------------
    // LOAD LANDLORD PROFILE
    // ------------------------------------------------------------
    useEffect(() => {
        if (!user?.landlord_id) return;

        setDataLoading(true);

        fetch(`/api/landlord/${user.landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                setLandlordId(data.landlord_id);

                setFirstName(user.firstName || "");
                setLastName(user.lastName || "");
                setCompanyName(user.companyName || "");
                setPhoneNumber(user.phoneNumber || "");
                setCivilStatus(user.civil_status || "");
                setDateOfBirth(user.birthDate || "");
                setCitizenship(user.citizenship || "");
                setOccupation(user.occupation || "");
                setAddress(data.address || "");
            })
            .finally(() => setDataLoading(false));
    }, [user]);

    // ------------------------------------------------------------
    // CAMERA PERMISSION & DETECTION
    // ------------------------------------------------------------
    const detectCameraDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const found = devices.some((d) => d.kind === "videoinput");
            setHasCamera(found);
            if (!found) setCameraError("No camera detected.");
        } catch {
            setCameraError("Unable to detect camera.");
        }
    };

    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraAllowed(true);
            stream.getTracks().forEach((t) => t.stop());
        } catch {
            setCameraAllowed(false);
            setCameraError("Camera access denied.");
        }
    };

    // ------------------------------------------------------------
    // DOCUMENT CAPTURE WITH ANALYSIS
    // ------------------------------------------------------------
    const handleEnhancedCapture = async () => {
        if (!webcamRef.current) return;

        const img = webcamRef.current.getScreenshot();
        if (!img) return;

        setIsAnalyzing(true);
        setCaptureGuidance("Analyzing...");

        const quality = await checkImageQuality(img);
        setImageQuality(quality);

        if (quality.isBlurry) return setCaptureGuidance("Image is blurry.");
        if (quality.isTooDark) return setCaptureGuidance("Too dark.");
        if (quality.isTooLight) return setCaptureGuidance("Too bright.");

        setCapturedDocument(img);
        setCaptureGuidance("Document captured!");
        setIsAnalyzing(false);
    };

    useEffect(() => {
        if (captureCountdown <= 0) return;

        const timer = setInterval(() => {
            setCaptureCountdown((prev) => {
                if (prev === 1) {
                    handleEnhancedCapture();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [captureCountdown]);

    const startAutoCapture = () => {
        setCaptureCountdown(3);
        setCaptureGuidance("Hold still...");
    };

    // ------------------------------------------------------------
    // SELFIE CAPTURE
    // ------------------------------------------------------------
    const captureSelfie = () => {
        if (!webcamRef.current) return;
        const img = webcamRef.current.getScreenshot();
        setSelfie(img);
        setIsCameraOpen(false);
    };

    // ------------------------------------------------------------
    // FINAL SUBMIT
    // ------------------------------------------------------------
    const handleSubmit = async () => {
        const form = new FormData();

        // Personal info
        form.append("landlord_id", landlordId || "");
        form.append("firstName", firstName);
        form.append("lastName", lastName);
        form.append("companyName", companyName);
        form.append("phoneNumber", phoneNumber);
        form.append("civil_status", civilStatus);
        form.append("dateOfBirth", dateOfBirth);
        form.append("citizenship", citizenship);
        form.append("occupation", occupation);
        form.append("address", address);

        // Payout
        form.append("payoutMethod", payoutMethod);
        form.append("accountName", accountName);
        form.append("accountNumber", accountNumber);
        form.append("bankName", payoutMethod === "bank_transfer" ? bankName : "");

        // Document
        form.append("documentType", selectedDocument);
        if (uploadedFile) form.append("uploadedFile", uploadedFile);
        if (capturedDocument) form.append("capturedDocument", capturedDocument);

        // Selfie
        if (selfie) form.append("selfie", selfie);

        try {
            const res = await fetch("/api/landlord/verification-upload", {
                method: "POST",
                body: form,
            });

            if (!res.ok) throw new Error("Upload failed");

            Swal.fire({
                icon: "success",
                title: "Verification Submitted",
                text: "Your details have been successfully submitted.",
            });

            router.push("/pages/landlord/dashboard");
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    // ------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------
    return {
        currentStep,
        selectedDocument,
        uploadOption,
        uploadedFile,
        capturedDocument,
        selfie,
        firstName,
        lastName,
        companyName,
        phoneNumber,
        civilStatus,
        dateOfBirth,
        address,
        citizenship,
        occupation,

        payoutMethod,
        accountName,
        accountNumber,
        bankName,

        suggestions,
        isCameraOpen,
        hasCamera,
        cameraAllowed,
        cameraError,
        imageQuality,
        isAnalyzing,
        captureGuidance,
        captureCountdown,
        dataLoading,

        webcamRef,

        setCurrentStep,
        setSelectedDocument,
        setUploadOption,
        setUploadedFile,
        setCapturedDocument,
        setSelfie,
        setFirstName,
        setLastName,
        setCompanyName,
        setPhoneNumber,
        setCivilStatus,
        setDateOfBirth,
        setAddress,
        setCitizenship,
        setOccupation,

        setPayoutMethod,
        setAccountName,
        setAccountNumber,
        setBankName,

        setSuggestions,
        setIsCameraOpen,

        detectCameraDevices,
        requestCameraPermission,
        handleEnhancedCapture,
        startAutoCapture,
        captureSelfie,
        handleSubmit,
    };
}
