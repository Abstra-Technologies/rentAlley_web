"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import {
  FiCamera,
  FiCheckCircle,
  FiX,
  FiAlertTriangle,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";

interface StepSelfieProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
}

export default function StepSelfie({ value, onChange }: StepSelfieProps) {
  const [mode, setMode] = useState<"idle" | "capture">("idle");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const webcamRef = useRef<Webcam>(null);

  /* ---------- PREVIEW ---------- */
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    // Handle both File objects and base64 strings
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === "string") {
      setPreviewUrl(value);
    }
  }, [value]);

  /* ---------- CLEANUP CAMERA ---------- */
  useEffect(() => {
    return () => {
      webcamRef.current?.stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  /* ---------- CAMERA ---------- */
  const requestCamera = async () => {
    setCameraError(null);
    setCameraReady(false);
    setMode("capture");
  };

  const handleCameraError = (error: string | DOMException) => {
    const errorMessage = typeof error === "string" ? error : error.message;

    // Check if we're on localhost without HTTPS
    const isInsecureLocalhost =
      typeof window !== "undefined" &&
      window.location.hostname === "localhost" &&
      window.location.protocol !== "https:";

    if (
      errorMessage.includes("Permission denied") ||
      errorMessage.includes("NotAllowedError")
    ) {
      if (isInsecureLocalhost) {
        setCameraError(
          "Camera access may be blocked on localhost. Try using HTTPS (e.g., run with 'next dev --experimental-https').",
        );
      } else {
        setCameraError(
          "Camera access denied. Please allow camera permissions in your browser settings, then try again.",
        );
      }
    } else if (
      errorMessage.includes("NotFoundError") ||
      errorMessage.includes("DevicesNotFoundError")
    ) {
      setCameraError("No camera found. Please connect a camera and try again.");
    } else if (
      errorMessage.includes("NotReadableError") ||
      errorMessage.includes("TrackStartError")
    ) {
      setCameraError(
        "Camera is in use by another application. Please close other apps using your camera.",
      );
    } else {
      setCameraError(
        "Unable to access camera. Please check your browser permissions and try again.",
      );
    }
    setMode("idle");
  };

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setCameraError("Failed to capture image. Please try again.");
      return;
    }

    // Convert base64 to blob without using fetch
    try {
      const base64Data = imageSrc.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const file = new File([blob], `selfie-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Stop camera stream first
      webcamRef.current?.stream?.getTracks().forEach((track) => track.stop());

      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        onChange(file);
        setMode("idle");
      }, 0);
    } catch (error) {
      setCameraError("Failed to process image. Please try again.");
    }
  }, [onChange]);

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          // Call handleCapture outside of setState using setTimeout
          setTimeout(() => handleCapture(), 0);
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const cancelCamera = () => {
    webcamRef.current?.stream?.getTracks().forEach((track) => track.stop());
    setMode("idle");
    setCameraReady(false);
    setCountdown(null);
  };

  const removeImage = () => {
    onChange(null);
    setCameraError(null);
  };

  const retakePhoto = () => {
    onChange(null);
    setCameraError(null);
    requestCamera();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 mb-3 sm:mb-4">
          <FiUser className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
          Take a Selfie
        </h2>
        <p className="text-sm sm:text-base text-gray-500">
          We'll match your face with your ID photo
        </p>
      </div>

      {/* ---------- ERROR ---------- */}
      {cameraError && (
        <div className="bg-red-50 border border-red-100 rounded-xl sm:rounded-2xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <FiAlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-0.5">{cameraError}</p>
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FiX className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* ---------- PREVIEW ---------- */}
      {previewUrl && mode === "idle" && (
        <div className="space-y-4">
          <div className="relative mx-auto w-48 h-48 sm:w-64 sm:h-64">
            <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-emerald-200 shadow-xl shadow-emerald-500/10">
              <img
                src={previewUrl}
                alt="Selfie Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Success badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="bg-emerald-500 text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <FiCheckCircle className="w-4 h-4" />
                <span>Photo captured</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 max-w-xs mx-auto">
            <button
              onClick={removeImage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <FiX className="w-4 h-4" />
              <span>Remove</span>
            </button>
            <button
              onClick={retakePhoto}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-emerald-200 rounded-xl font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Retake</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------- CAMERA BUTTON ---------- */}
      {!value && mode === "idle" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={requestCamera}
            className="w-full group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-dashed border-emerald-200 cursor-pointer hover:from-emerald-100 hover:to-blue-100 hover:border-emerald-300 transition-all duration-200"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 group-hover:shadow-xl transition-shadow">
              <FiCamera className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
              Open Camera
            </span>
            <span className="text-sm text-gray-500 mt-1">
              Take a photo using your front camera
            </span>
          </button>
        </div>
      )}

      {/* ---------- CAMERA CAPTURE ---------- */}
      {mode === "capture" && (
        <div className="space-y-4">
          <div className="relative mx-auto" style={{ maxWidth: "320px" }}>
            {/* Circular camera view */}
            <div className="relative aspect-square rounded-full overflow-hidden bg-black shadow-2xl shadow-gray-900/20">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 720 },
                  height: { ideal: 720 },
                  aspectRatio: 1,
                }}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={(error) => handleCameraError(error)}
                className="w-full h-full object-cover scale-x-[-1]"
                mirrored={true}
              />

              {/* Camera loading overlay */}
              {!cameraReady && (
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                  <p className="text-white/80 text-sm">Starting camera...</p>
                </div>
              )}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-7xl font-bold text-white animate-pulse">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Face guide overlay */}
              {cameraReady && countdown === null && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Face outline guide */}
                  <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-white/40 rounded-full" />

                  {/* Corner guides */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                  >
                    <defs>
                      <linearGradient
                        id="guideGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>

            {/* Decorative ring */}
            <div
              className="absolute -inset-2 rounded-full border-4 border-gradient-to-r from-blue-500/20 to-emerald-500/20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(16,185,129,0.1) 100%)",
                borderRadius: "9999px",
              }}
            />
          </div>

          {/* Instructions */}
          {cameraReady && countdown === null && (
            <p className="text-center text-sm text-gray-500">
              Position your face in the circle and look at the camera
            </p>
          )}

          {/* Capture buttons */}
          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              type="button"
              onClick={cancelCamera}
              disabled={countdown !== null}
              className="flex-1 px-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!cameraReady || countdown !== null}
              onClick={startCountdown}
              className={`
                                flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 
                                rounded-xl font-semibold transition-all duration-200
                                ${
                                  cameraReady && countdown === null
                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-[0.98]"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }
                            `}
            >
              <FiCamera className="w-5 h-5" />
              <span>{countdown !== null ? `${countdown}...` : "Capture"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!value && mode === "idle" && (
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl sm:rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Tips for a good selfie:
          </p>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Find good lighting - face a window or light source</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Remove glasses, hats, or face coverings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Keep a neutral expression and look directly at camera</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
