// app/(whatever)/landlord/verification/page.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { DOCUMENT_TYPES } from "../../../../constant/docTypes";

import {
    FiInfo,
    FiCheck,
    FiAlertCircle,
    FiCamera,
    FiUpload,
    FiUser,
    FiMapPin,
    FiCalendar,
    FiGlobe,
    FiHeart,
    FiFileText,
    FiEye,
    FiCheckCircle,
    FiPhone,
    FiBriefcase,
    FiArrowRight,
    FiArrowLeft,
    FiShield,
    FiCreditCard,
} from "react-icons/fi";

import LoadingScreen from "../../../../components/loadingScreen";
import CountrySelector from "@/components/ui/CountrySelector";
import useLandlordVerification from "@/hooks/landlord/useLandlordVerification";

/**
 * LandlordVerification Page (clean + optimized)
 *
 * 5 steps:
 * 1 - Personal Info
 * 2 - Payout Setup
 * 3 - ID Document
 * 4 - Selfie Verification
 * 5 - Review & Submit
 *
 * Expects hook API (from your hook):
 * - states, refs, setters and actions as used below
 */

export default function LandlordVerificationPage() {
    // Hook
    const {
        // state
        currentStep,
        selectedDocument,
        uploadOption,
        uploadedFile,
        capturedDocument,
        selfie,
        landlordId,
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

        // refs
        webcamRef,

        // setters
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

        // actions
        detectCameraDevices,
        requestCameraPermission,
        handleEnhancedCapture,
        startAutoCapture,
        captureSelfie,
        handleSubmit,
    } = useLandlordVerification();

    const addressInputRef = useRef<HTMLInputElement | null>(null);

    // When user opens camera UI (by clicking the button), ensure camera detection / permission are attempted.
    useEffect(() => {
        if (isCameraOpen) {
            detectCameraDevices();
            requestCameraPermission();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCameraOpen]);

    if (dataLoading) return <LoadingScreen />;

    const steps = [
        { id: 1, title: "Personal Info", icon: FiUser, description: "Basic details" },
        { id: 2, title: "Payout Setup", icon: FiCreditCard, description: "Where you'll receive payments" },
        { id: 3, title: "ID Document", icon: FiFileText, description: "Upload or capture" },
        { id: 4, title: "Verification", icon: FiCamera, description: "Selfie capture" },
        { id: 5, title: "Review", icon: FiEye, description: "Confirm & submit" },
    ];

    // small UI helpers
    const handleDocumentChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
        setSelectedDocument(e.target.value);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file) setUploadedFile(file);
    };

    const getQualityIndicator = () => {
        if (!imageQuality) return null;

        const issues: string[] = [];
        if (imageQuality.isBlurry) issues.push("Blurry");
        if (imageQuality.isTooDark) issues.push("Too Dark");
        if (imageQuality.isTooLight) issues.push("Too Light");

        if (issues.length === 0) {
            return (
                <div className="flex items-center text-emerald-600 text-sm mt-3 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <FiCheckCircle className="mr-2 text-lg" />
                    <span className="font-medium">Excellent image quality!</span>
                </div>
            );
        }

        return (
            <div className="flex items-center text-amber-600 text-sm mt-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <FiAlertCircle className="mr-2 text-lg" />
                <div>
                    <p className="font-medium">Image quality issues detected:</p>
                    <p className="text-xs mt-1">{issues.join(", ")}</p>
                </div>
            </div>
        );
    };

    // Step completion checks (display/enable logic)
    const isStepComplete = (stepNumber: number) => {
        switch (stepNumber) {
            case 1:
                return (
                    Boolean(firstName) &&
                    Boolean(lastName) &&
                    Boolean(address) &&
                    Boolean(phoneNumber) &&
                    Boolean(dateOfBirth) &&
                    Boolean(citizenship) &&
                    Boolean(occupation)
                );
            case 2:
                return (
                    Boolean(payoutMethod) &&
                    Boolean(accountName) &&
                    Boolean(accountNumber) &&
                    (payoutMethod !== "bank_transfer" || Boolean(bankName))
                );
            case 3:
                return Boolean(selectedDocument) && (Boolean(uploadedFile) || Boolean(capturedDocument));
            case 4:
                return Boolean(selfie);
            case 5:
                return true;
            default:
                return false;
        }
    };

    const canProceed = () => isStepComplete(currentStep);

    // progress width for the 5-step flow
    const progressWidth = `${(currentStep / steps.length) * 100}%`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                        <FiShield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Landlord Identity Verification</h1>
                    <p className="text-gray-600">Secure verification process to protect your account and ensure trust</p>
                </div>

                {/* Steps */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id || (currentStep === step.id && isStepComplete(step.id));
                            return (
                                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                      ${isCompleted ? "bg-emerald-500 text-white shadow-lg" : isActive ? "bg-blue-500 text-white shadow-lg scale-110" : "bg-gray-200 text-gray-400"}`}
                                    >
                                        {isCompleted && currentStep > step.id ? <FiCheck className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                    </div>

                                    <div className="text-center">
                                        <p className={`font-medium text-sm ${isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-gray-500"}`}>
                                            {step.title}
                                        </p>
                                        <p className={`text-xs ${isActive ? "text-blue-500" : "text-gray-400"}`}>{step.description}</p>
                                    </div>

                                    {index < steps.length - 1 && (
                                        <div
                                            className={`absolute top-6 left-1/2 transform -translate-x-1/2 w-full h-0.5 -z-10 transition-all duration-300 ${isCompleted ? "bg-emerald-500" : "bg-gray-200"}`}
                                            style={{ width: `${100 / steps.length}%` }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: progressWidth }} />
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* Step 1 - Personal Info */}
                        {currentStep === 1 && (
                            <section className="space-y-6">
                                <div className="flex items-center mb-6">
                                    <FiUser className="w-6 h-6 text-blue-500 mr-3" />
                                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                                            First Name
                                        </label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                                            Last Name
                                        </label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                                            Company Name (optional)
                                        </label>
                                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name (if applicable)" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                                            Date of Birth
                                        </label>
                                        <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                                            Phone Number
                                        </label>
                                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="09XXXXXXXXX" className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-600 focus:outline-none ${phoneNumber && !/^09\d{9}$/.test(phoneNumber) ? "border-red-400" : "border-gray-200"}`} />
                                        {phoneNumber && !/^09\d{9}$/.test(phoneNumber) && <p className="text-red-500 text-xs mt-1">Phone number must be 11 digits and start with 09 (e.g., 09213218888)</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiHeart className="w-4 h-4 mr-2 text-gray-400" />
                                            Civil Status
                                        </label>
                                        <select value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none">
                                            <option value="">Select status...</option>
                                            <option value="single">Single</option>
                                            <option value="married">Married</option>
                                            <option value="widowed">Widowed</option>
                                            <option value="separated">Separated</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2 space-y-2 relative">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                                            Home Address
                                        </label>
                                        <input ref={addressInputRef} type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Start typing your address..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
                                        {address.length > 0 && (
                                            <ul className="absolute z-10 bg-white border border-gray-200 w-full rounded-xl max-h-60 overflow-auto mt-1">
                                                {suggestions.map((item: any, idx: number) => (
                                                    <li key={idx} onClick={() => { setAddress(item.display_name); setSuggestions([]); }} className="px-4 py-2 hover:bg-blue-100 cursor-pointer">
                                                        {item.display_name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiGlobe className="w-4 h-4 mr-2 text-gray-400" />
                                            Citizenship
                                        </label>
                                        <CountrySelector value={citizenship} onChange={setCitizenship} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                                            Occupation
                                        </label>
                                        <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Enter your occupation" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Step 2 - Payout Information */}
                        {currentStep === 2 && (
                            <section className="space-y-6">
                                <div className="flex items-center mb-6">
                                    <FiCreditCard className="w-6 h-6 text-blue-500 mr-3" />
                                    <h2 className="text-2xl font-bold text-gray-900">Payout Information</h2>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiCreditCard className="w-4 h-4 mr-2 text-gray-400" />
                                            Select Payout Method
                                        </label>
                                        <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none">
                                            <option value="">Choose payout method...</option>
                                            <option value="gcash">GCash</option>
                                            <option value="maya">Maya</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                                            Account Name
                                        </label>
                                        <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Registered account name" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                                            Account / Mobile Number
                                        </label>
                                        <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter number" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                    </div>

                                    {payoutMethod === "bank_transfer" && (
                                        <div className="space-y-2 md:col-span-2 animate-fadeIn">
                                            <label className="flex items-center text-sm font-medium text-gray-700">
                                                <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                                                Bank Name
                                            </label>
                                            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., BPI, BDO, Metrobank" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none" />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start">
                                        <FiInfo className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-800 mb-1">Why we need this</h4>
                                            <p className="text-blue-700 text-sm">Your payout details are required so Upkyp can send your rental income, utility fees, deposits, and other disbursements securely.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Step 3 - ID Document */}
                        {currentStep === 3 && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <FiFileText className="w-6 h-6 text-blue-500 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900">Identity Document</h2>
                                    </div>
                                    <button onClick={() => {}} className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                                        <FiInfo className="w-4 h-4 mr-1" />
                                        What's accepted?
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Select Document Type</label>
                                    <select value={selectedDocument} onChange={handleDocumentChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                        <option value="">Choose your document type...</option>
                                        {DOCUMENT_TYPES.map((doc) => (
                                            <option key={doc.value} value={doc.value}>
                                                {doc.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedDocument && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600">How would you like to provide your document?</p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setUploadOption("upload")} className={`p-4 border-2 rounded-xl transition-all duration-200 ${uploadOption === "upload" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-600"}`}>
                                                <FiUpload className="w-6 h-6 mx-auto mb-2" />
                                                <p className="font-medium">Upload File</p>
                                                <p className="text-xs opacity-75">From your device</p>
                                            </button>

                                            <button onClick={() => setUploadOption("capture")} className={`p-4 border-2 rounded-xl transition-all duration-200 ${uploadOption === "capture" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-600"}`}>
                                                <FiCamera className="w-6 h-6 mx-auto mb-2" />
                                                <p className="font-medium">Take Photo</p>
                                                <p className="text-xs opacity-75">Use camera</p>
                                            </button>
                                        </div>

                                        {uploadOption === "upload" && (
                                            <div className="mt-6">
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                                                    <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                    <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" id="file-upload" />
                                                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200">
                                                        Choose File
                                                    </label>
                                                    <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                                                </div>

                                                {uploadedFile && (
                                                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                        <div className="flex items-center">
                                                            <FiCheckCircle className="w-5 h-5 text-emerald-600 mr-3" />
                                                            <div>
                                                                <p className="font-medium text-emerald-800">File uploaded successfully!</p>
                                                                <p className="text-sm text-emerald-600">{(uploadedFile as File).name}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {uploadOption === "capture" && (
                                            <div className="mt-6 space-y-4">
                                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                                                        <FiInfo className="w-4 h-4 mr-2" />
                                                        Capture Tips
                                                    </h4>
                                                    <ul className="text-blue-700 text-sm space-y-1">
                                                        <li>• Ensure document fills most of the frame</li>
                                                        <li>• Use bright, even lighting</li>
                                                        <li>• Avoid shadows and glare</li>
                                                        <li>• Keep camera steady and focused</li>
                                                        <li>• Ensure all text is clearly readable</li>
                                                    </ul>
                                                </div>

                                                <div className="relative">
                                                    {cameraError ? (
                                                        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                                                            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                                            <h3 className="text-red-700 font-semibold mb-2">Camera Issue</h3>
                                                            <p className="text-sm text-red-600 mb-4">{cameraError}</p>
                                                            <button onClick={requestCameraPermission} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">
                                                                Retry Camera Access
                                                            </button>
                                                        </div>
                                                    ) : !hasCamera ? (
                                                        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                                                            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                                            <h3 className="text-red-700 font-semibold mb-2">No Camera Detected</h3>
                                                            <p className="text-sm text-red-600 mb-4">Please connect or enable a camera to capture your document.</p>
                                                            <button onClick={detectCameraDevices} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">
                                                                Retry Detection
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded-xl border-2 border-gray-200" videoConstraints={{ width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: "user" } }} />
                                                            {captureGuidance && (
                                                                <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-center">
                                                                    <p className="text-sm">{captureCountdown > 0 ? `${captureGuidance} ${captureCountdown}` : captureGuidance}</p>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 pointer-events-none">
                                                                <div className="absolute inset-8 border-2 border-white border-dashed rounded-lg opacity-50" />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex gap-3">
                                                    <button onClick={handleEnhancedCapture} disabled={isAnalyzing || !cameraAllowed} className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-all">
                                                        {isAnalyzing ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                                Analyzing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiCamera className="w-4 h-4 mr-2" />
                                                                Capture Document
                                                            </>
                                                        )}
                                                    </button>

                                                    <button onClick={startAutoCapture} disabled={isAnalyzing || captureCountdown > 0 || !cameraAllowed} className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-all">
                                                        {captureCountdown > 0 ? (
                                                            <>
                                                                <div className="animate-pulse w-4 h-4 bg-white rounded-full mr-2" />
                                                                Auto-capture ({captureCountdown}s)
                                                            </>
                                                        ) : (
                                                            "Auto-capture"
                                                        )}
                                                    </button>
                                                </div>

                                                {getQualityIndicator()}

                                                {capturedDocument && (
                                                    <div className="mt-6 space-y-4">
                                                        <div className="text-center">
                                                            <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                                            <h3 className="font-semibold text-emerald-700 text-lg">Document Captured!</h3>
                                                        </div>

                                                        <div className="relative">
                                                            <img src={capturedDocument} alt="Document Preview" className="w-full max-w-md mx-auto rounded-xl border-2 border-emerald-200 shadow-lg" />
                                                        </div>

                                                        <button onClick={() => setCapturedDocument(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors">
                                                            Retake Photo
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Step 4 - Selfie */}
                        {currentStep === 4 && (
                            <section className="space-y-6">
                                <div className="flex items-center mb-6">
                                    <FiCamera className="w-6 h-6 text-blue-500 mr-3" />
                                    <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                    <div className="flex items-start">
                                        <FiInfo className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-800 mb-1">Selfie Guidelines</h4>
                                            <ul className="text-amber-700 text-sm space-y-1">
                                                <li>• Look directly at the camera</li>
                                                <li>• Ensure your face is well-lit and clearly visible</li>
                                                <li>• Remove sunglasses and hats</li>
                                                <li>• Keep a neutral expression</li>
                                                <li>• Make sure your full face fits in the frame</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {isCameraOpen ? (
                                    <div className="space-y-4">
                                        {cameraError ? (
                                            <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                                                <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                                <h3 className="text-red-700 font-semibold mb-2">Camera Issue</h3>
                                                <p className="text-sm text-red-600 mb-4">{cameraError}</p>
                                                <button onClick={requestCameraPermission} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">
                                                    Retry Camera Access
                                                </button>
                                            </div>
                                        ) : !hasCamera ? (
                                            <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                                                <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                                <h3 className="text-red-700 font-semibold mb-2">No Camera Detected</h3>
                                                <p className="text-sm text-red-600 mb-4">Please connect a webcam or enable your mobile camera.</p>
                                                <button onClick={detectCameraDevices} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">
                                                    Retry Detection
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative">
                                                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full max-w-md mx-auto rounded-xl border-2 border-gray-200 shadow-lg" videoConstraints={{ width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: "user" } }} />
                                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                        <div className="w-48 h-64 border-2 border-white border-dashed rounded-full opacity-50" />
                                                    </div>
                                                </div>

                                                <button onClick={captureSelfie} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center">
                                                    <FiCamera className="w-4 h-4 mr-2" />
                                                    Take Selfie
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : selfie ? (
                                    <div className="space-y-4 text-center">
                                        <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                                        <h3 className="font-semibold text-emerald-700 text-lg">Perfect!</h3>

                                        <img src={selfie} alt="Selfie Preview" className="w-48 h-64 object-cover rounded-xl border-2 border-emerald-200 shadow-lg mx-auto" />

                                        <button onClick={() => setIsCameraOpen(true)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors">
                                            Retake Selfie
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                            <FiCamera className="w-12 h-12 text-blue-500" />
                                        </div>

                                        <button onClick={() => setIsCameraOpen(true)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center">
                                            <FiCamera className="w-4 h-4 mr-2" />
                                            Open Camera for Selfie
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Step 5 - Review */}
                        {currentStep === 5 && (
                            <section className="space-y-6">
                                <div className="flex items-center mb-6">
                                    <FiEye className="w-6 h-6 text-blue-500 mr-3" />
                                    <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                    <h3 className="font-semibold text-gray-900 mb-4">Verify Your Information</h3>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Full Legal Name</p>
                                            <p className="text-gray-900">{`${firstName} ${lastName}`}</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Date of Birth</p>
                                            <p className="text-gray-900">{dateOfBirth}</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border md:col-span-2">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Home Address</p>
                                            <p className="text-gray-900">{address}</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Place of Birth</p>
                                            <p className="text-gray-900">{citizenship}</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Document Type</p>
                                            <p className="text-gray-900">{DOCUMENT_TYPES.find((doc) => doc.value === selectedDocument)?.label}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h4>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <p className="font-medium text-gray-700 mb-2">Identity Document</p>
                                            {uploadedFile ? (
                                                <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <FiFileText className="w-5 h-5 text-blue-600 mr-3" />
                                                    <span className="text-blue-800">{(uploadedFile as File).name}</span>
                                                </div>
                                            ) : capturedDocument ? (
                                                <img src={capturedDocument} alt="Document Preview" className="w-full max-w-xs rounded-lg border shadow-sm" />
                                            ) : null}
                                        </div>

                                        <div>
                                            <p className="font-medium text-gray-700 mb-2">Identity Verification</p>
                                            {selfie && <img src={selfie} alt="Selfie Preview" className="w-32 h-40 object-cover rounded-lg border shadow-sm" />}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start">
                                        <FiShield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-800 mb-1">Privacy & Security</h4>
                                            <p className="text-blue-700 text-sm">Your documents are encrypted and processed securely. We use this information solely for identity verification purposes in compliance with applicable regulations.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Footer actions */}
                    <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                            {currentStep > 1 ? (
                                <button onClick={() => setCurrentStep(currentStep - 1)} className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-all">
                                    <FiArrowLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 5 ? (
                                <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="inline-flex items-center px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none">
                                    Continue
                                    <FiArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            ) : (
                                <button onClick={handleSubmit} className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                                    <FiCheckCircle className="w-4 h-4 mr-2" />
                                    Submit Verification
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
