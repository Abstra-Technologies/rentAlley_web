"use client";

import {
    FiCamera,
    FiAlertCircle,
    FiCheckCircle
} from "react-icons/fi";
import Webcam from "react-webcam";

export default function DocumentCapture({
                                            cameraAllowed,
                                            hasCamera,
                                            cameraError,

                                            webcamRef,

                                            captureGuidance,
                                            captureCountdown,

                                            isAnalyzing,
                                            capturedDocument,
                                            imageQuality,

                                            startAutoCapture,
                                            handleEnhancedCapture,

                                            setCapturedDocument,
                                            setImageQuality,
                                            setCaptureGuidance
                                        }) {
    return (
        <div className="mt-6 space-y-4">
            {/* CAMERA ERRORS */}
            {!hasCamera ? (
                <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                    <FiAlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-red-700 mb-2">No Camera Detected</h3>
                    <p className="text-sm text-red-600 mb-4">
                        Please connect or enable a camera to capture your document.
                    </p>
                </div>
            ) : cameraError ? (
                <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                    <FiAlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-red-700 mb-2">Camera Issue</h3>
                    <p className="text-sm text-red-600 mb-4">{cameraError}</p>
                </div>
            ) : (
                <>
                    {/* CAMERA PREVIEW */}
                    {!capturedDocument && (
                        <div className="relative">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full rounded-xl border-2 border-gray-200"
                                videoConstraints={{
                                    width: { ideal: 1280 },
                                    height: { ideal: 720 },
                                    facingMode: "environment",
                                }}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-8 border-2 border-white border-dashed rounded-lg opacity-60"></div>
                            </div>

                            {/* Capture Guidance */}
                            {captureGuidance && (
                                <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-center">
                                    <p className="text-sm">
                                        {captureCountdown > 0
                                            ? `${captureGuidance} ${captureCountdown}`
                                            : captureGuidance}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CAPTURE BUTTONS */}
                    {!capturedDocument && (
                        <div className="flex gap-3">
                            {/* Manual Capture */}
                            <button
                                onClick={handleEnhancedCapture}
                                disabled={!cameraAllowed || isAnalyzing}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center transition-all"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <FiCamera className="w-4 h-4 mr-2" />
                                        Capture Document
                                    </>
                                )}
                            </button>

                            {/* Auto Capture */}
                            <button
                                onClick={startAutoCapture}
                                disabled={!cameraAllowed || captureCountdown > 0 || isAnalyzing}
                                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white py-3 px-4 rounded-xl font-medium transition-all"
                            >
                                {captureCountdown > 0
                                    ? `Auto-capture (${captureCountdown}s)`
                                    : "Auto-capture"}
                            </button>
                        </div>
                    )}

                    {/* IMAGE QUALITY OUTPUT */}
                    {imageQuality && !capturedDocument && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center">
                            <FiAlertCircle className="w-5 h-5 mr-2" />
                            <span>
                {imageQuality.isBlurry && "Image is blurry. "}
                                {imageQuality.isTooDark && "Too dark. "}
                                {imageQuality.isTooLight && "Too bright. "}
              </span>
                        </div>
                    )}

                    {/* DOCUMENT PREVIEW */}
                    {capturedDocument && (
                        <div className="mt-6 space-y-4">
                            <div className="text-center">
                                <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                <h3 className="font-semibold text-emerald-700 text-lg">
                                    Document Captured!
                                </h3>
                            </div>

                            <img
                                src={capturedDocument}
                                alt="Document Preview"
                                className="w-full max-w-md mx-auto rounded-xl border-2 border-emerald-300 shadow-lg"
                            />

                            {/* Retake */}
                            <button
                                onClick={() => {
                                    setCapturedDocument(null);
                                    setImageQuality(null);
                                    setCaptureGuidance("");
                                }}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-all"
                            >
                                Retake Photo
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
