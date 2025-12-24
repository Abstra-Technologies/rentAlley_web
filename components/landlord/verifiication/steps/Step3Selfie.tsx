"use client";

import Webcam from "react-webcam";
import { FiCamera, FiAlertCircle, FiInfo, FiCheckCircle } from "react-icons/fi";

export default function StepSelfie(props: any) {
    const {
        isCameraOpen,
        setIsCameraOpen,
        selfie,
        setSelfie,
        webcamRef,
        hasCamera,
        cameraError,
        detectCameraDevices,
        requestCameraPermission,
        captureSelfie,
    } = props;

    return (
        <section className="space-y-6">
            <div className="flex items-center mb-2">
                <FiCamera className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                    Identity Verification
                </h2>
            </div>

            {/* 🔐 Selfie Description */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start">
                <FiInfo className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-amber-800 text-sm">
                    Please take a clear selfie of yourself. Your face must be
                    clearly visible and should <strong>match the identity
                    document</strong> you uploaded earlier. Avoid wearing hats,
                    sunglasses, or face coverings, and ensure good lighting.
                </p>
            </div>

            {isCameraOpen ? (
                <>
                    {cameraError ? (
                        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-red-600">{cameraError}</p>
                            <button
                                onClick={requestCameraPermission}
                                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl"
                            >
                                Retry Camera Access
                            </button>
                        </div>
                    ) : !hasCamera ? (
                        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <button
                                onClick={detectCameraDevices}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl"
                            >
                                Retry Detection
                            </button>
                        </div>
                    ) : (
                        <>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full max-w-md mx-auto rounded-xl border-2 border-gray-200"
                                videoConstraints={{ facingMode: "user" }}
                            />

                            <button
                                onClick={captureSelfie}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl"
                            >
                                <FiCamera className="inline mr-2" />
                                Take Selfie
                            </button>
                        </>
                    )}
                </>
            ) : selfie ? (
                <div className="text-center space-y-4">
                    <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                    <img
                        src={selfie}
                        alt="Selfie preview"
                        className="w-48 h-64 mx-auto rounded-xl border"
                    />
                    <button
                        onClick={() => setIsCameraOpen(true)}
                        className="w-full bg-gray-100 py-3 rounded-xl"
                    >
                        Retake Selfie
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl"
                >
                    Open Camera for Selfie
                </button>
            )}
        </section>
    );
}
