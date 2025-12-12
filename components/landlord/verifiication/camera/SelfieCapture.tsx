"use client";

import Webcam from "react-webcam";
import {
    FiCamera,
    FiAlertCircle,
    FiCheckCircle,
    FiRefreshCcw
} from "react-icons/fi";

export default function SelfieCapture({
                                          webcamRefSelfie,
                                          isCameraOpen,
                                          setIsCameraOpen,
                                          cameraAllowed,
                                          hasCamera,
                                          cameraError,
                                          selfie,
                                          setSelfie,
                                          captureSelfie
                                      }) {
    return (
        <div className="space-y-6">
            {/* CAMERA ERRORS */}
            {!hasCamera ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                    <FiAlertCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-red-700">No Camera Detected</h3>
                    <p className="text-sm text-red-600 mt-1">
                        Please connect or enable a camera to proceed.
                    </p>
                </div>
            ) : cameraError ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                    <FiAlertCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-red-700">Camera Issue</h3>
                    <p className="text-sm text-red-600">{cameraError}</p>
                </div>
            ) : (
                <>
                    {/* OPEN CAMERA BUTTON */}
                    {!isCameraOpen && !selfie && (
                        <button
                            onClick={() => setIsCameraOpen(true)}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <FiCamera className="w-5 h-5" />
                            Open Camera
                        </button>
                    )}

                    {/* CAMERA PREVIEW */}
                    {isCameraOpen && !selfie && (
                        <div className="space-y-4">
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-md">
                                <Webcam
                                    audio={false}
                                    ref={webcamRefSelfie}
                                    screenshotFormat="image/jpeg"
                                    className="w-full"
                                    videoConstraints={{
                                        width: 1280,
                                        height: 720,
                                        facingMode: "user",
                                    }}
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-12 border-2 border-white border-dashed rounded-full opacity-70"></div>
                                </div>
                            </div>

                            {/* CAPTURE BUTTON */}
                            <button
                                onClick={captureSelfie}
                                disabled={!cameraAllowed}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition"
                            >
                                <FiCamera className="w-5 h-5" />
                                Capture Selfie
                            </button>
                        </div>
                    )}

                    {/* SELFIE PREVIEW */}
                    {selfie && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                <h3 className="font-semibold text-emerald-700 text-lg">
                                    Selfie Captured!
                                </h3>
                            </div>

                            <img
                                src={selfie}
                                alt="Captured Selfie"
                                className="w-full max-w-md mx-auto rounded-xl shadow-lg border-2 border-emerald-300"
                            />

                            {/* RETAKE */}
                            <button
                                onClick={() => {
                                    setSelfie(null);
                                    setIsCameraOpen(true);
                                }}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 transition"
                            >
                                <FiRefreshCcw className="w-5 h-5" />
                                Retake Selfie
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
