"use client";

import { useState } from "react";
import Webcam from "react-webcam";
import { DOCUMENT_TYPES } from "@/constant/docTypes";

import {
    FiInfo,
    FiAlertCircle,
    FiCamera,
    FiUpload,
    FiCheckCircle,
    FiFileText,
} from "react-icons/fi";

export default function StepDocument(props: any) {
    const {
        selectedDocument,
        setSelectedDocument,
        uploadOption,
        setUploadOption,
        uploadedFile,
        setUploadedFile,
        capturedDocument,
        setCapturedDocument,

        webcamRef,

        cameraError,
        hasCamera,

        detectCameraDevices,
        requestCameraPermission,

        handleEnhancedCapture,
        startAutoCapture,

        imageQuality,
        isAnalyzing,
        captureGuidance,
        captureCountdown,
    } = props;

    /** ✅ LOCAL, REACTIVE CAMERA STATE */
    const [cameraReady, setCameraReady] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file) setUploadedFile(file);
    };

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <FiFileText className="w-6 h-6 text-blue-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">
                        Identity Document
                    </h2>
                </div>
                <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                    <FiInfo className="w-4 h-4 mr-1" />
                    What's accepted?
                </button>
            </div>

            {/* Document type */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Select Document Type
                </label>
                <select
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                >
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
                    {/* Upload / Capture choice */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setUploadOption("upload")}
                            className={`p-4 border-2 rounded-xl ${
                                uploadOption === "upload"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200"
                            }`}
                        >
                            <FiUpload className="mx-auto mb-2" />
                            Upload File
                        </button>

                        <button
                            onClick={() => {
                                setUploadOption("capture");
                                detectCameraDevices();
                                requestCameraPermission();
                            }}
                            className={`p-4 border-2 rounded-xl ${
                                uploadOption === "capture"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200"
                            }`}
                        >
                            <FiCamera className="mx-auto mb-2" />
                            Take Photo
                        </button>
                    </div>

                    {/* FILE UPLOAD */}
                    {uploadOption === "upload" && (
                        <div>
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                accept="image/*"
                            />
                            {uploadedFile && (
                                <p className="text-emerald-600 text-sm mt-2">
                                    {(uploadedFile as File).name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* CAMERA CAPTURE */}
                    {uploadOption === "capture" && (
                        <div className="space-y-4">
                            {cameraError ? (
                                <div className="text-red-600">{cameraError}</div>
                            ) : !hasCamera ? (
                                <div className="text-red-600">
                                    No camera detected
                                </div>
                            ) : (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full rounded-xl border"
                                        videoConstraints={{
                                            width: { ideal: 1280 },
                                            height: { ideal: 720 },
                                        }}
                                        onUserMedia={() =>
                                            setCameraReady(true)
                                        }
                                        onUserMediaError={() =>
                                            setCameraReady(false)
                                        }
                                    />

                                    {captureGuidance && (
                                        <div className="text-sm text-center text-white bg-black/70 rounded-lg p-2">
                                            {captureCountdown > 0
                                                ? `${captureGuidance} ${captureCountdown}`
                                                : captureGuidance}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleEnhancedCapture}
                                            disabled={
                                                isAnalyzing || !cameraReady
                                            }
                                            className="flex-1 bg-blue-500 text-white py-3 rounded-xl disabled:bg-blue-300"
                                        >
                                            {isAnalyzing
                                                ? "Analyzing..."
                                                : "Capture Document"}
                                        </button>

                                        <button
                                            onClick={startAutoCapture}
                                            disabled={
                                                isAnalyzing ||
                                                captureCountdown > 0 ||
                                                !cameraReady
                                            }
                                            className="flex-1 bg-indigo-500 text-white py-3 rounded-xl disabled:bg-indigo-300"
                                        >
                                            Auto-capture
                                        </button>
                                    </div>

                                    {/* IMAGE QUALITY */}
                                    {imageQuality && (
                                        <div className="text-sm mt-2">
                                            {imageQuality.isBlurry ||
                                            imageQuality.isTooDark ||
                                            imageQuality.isTooLight ? (
                                                <span className="text-amber-600">
                                                    ⚠ Image quality issue detected
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600">
                                                    ✓ Image quality is good
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {capturedDocument && (
                                <div className="text-center">
                                    <FiCheckCircle className="mx-auto text-emerald-500 text-3xl mb-2" />
                                    <img
                                        src={capturedDocument}
                                        className="max-w-md mx-auto rounded-xl border"
                                    />
                                    <button
                                        onClick={() =>
                                            setCapturedDocument(null)
                                        }
                                        className="mt-3 text-sm text-blue-600"
                                    >
                                        Retake photo
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}