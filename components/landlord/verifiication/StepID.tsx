"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  FiUpload,
  FiCamera,
  FiCheckCircle,
  FiX,
  FiAlertTriangle,
  FiChevronDown,
  FiImage,
  FiRefreshCw,
} from "react-icons/fi";

type Mode = "idle" | "capture";

interface StepIDProps {
  value: File | null;
  idType: string;
  firstName: string;
  lastName: string;
  onChange: (file: File | null) => void;
  onIdTypeChange: (type: string) => void;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
}

const ID_OPTIONS = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "umid", label: "UMID" },
  { value: "philsys", label: "PhilSys (National ID)" },
  { value: "prc", label: "PRC ID" },
  { value: "postal", label: "Postal ID" },
  { value: "voters", label: "Voter's ID" },
];

export default function StepID({
  value,
  idType,
  firstName,
  lastName,
  onChange,
  onIdTypeChange,
  onFirstNameChange,
  onLastNameChange,
}: StepIDProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = ID_OPTIONS.find((opt) => opt.value === idType);

  /* ---------- PREVIEW ---------- */
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [value]);

  /* ---------- CLEANUP CAMERA ---------- */
  useEffect(() => {
    return () => {
      webcamRef.current?.stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  /* ---------- CLOSE SELECT ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------- CAMERA ---------- */
  const requestCamera = async () => {
    if (!idType) return;

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
          "Camera access may be blocked on localhost. Try using HTTPS or upload a file instead.",
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
        "Unable to access camera. Please try uploading a file instead.",
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

    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `id-${idType}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onChange(file);
        setMode("idle");
        // Stop camera stream
        webcamRef.current?.stream?.getTracks().forEach((track) => track.stop());
      });
  }, [onChange, idType]);

  const cancelCamera = () => {
    webcamRef.current?.stream?.getTracks().forEach((track) => track.stop());
    setMode("idle");
    setCameraReady(false);
  };

  /* ---------- FILE UPLOAD ---------- */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setCameraError("File size must be less than 10MB");
      return;
    }

    onChange(file);
    setCameraError(null);
    setMode("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ---------- DRAG & DROP ---------- */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (idType) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!idType) return;

    const file = e.dataTransfer.files?.[0];
    processFile(file);
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
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 mb-3 sm:mb-4">
          <FiImage className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
          Upload Your ID
        </h2>
        <p className="text-sm sm:text-base text-gray-500">
          Enter your name as it appears on your ID
        </p>
      </div>

      {/* ---------- NAME FIELDS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Enter first name"
            className={`
                            w-full px-4 py-3 sm:py-3.5 bg-white border-2 rounded-xl sm:rounded-2xl
                            text-gray-900 placeholder-gray-400
                            transition-all duration-200
                            focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                            ${firstName ? "border-gray-200" : "border-gray-200"}
                        `}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Enter last name"
            className={`
                            w-full px-4 py-3 sm:py-3.5 bg-white border-2 rounded-xl sm:rounded-2xl
                            text-gray-900 placeholder-gray-400
                            transition-all duration-200
                            focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                            ${lastName ? "border-gray-200" : "border-gray-200"}
                        `}
          />
        </div>
      </div>

      {/* Name hint */}
      <p className="text-xs text-gray-400 -mt-2">
        Please enter your name exactly as it appears on your government ID
      </p>

      {/* ---------- ID TYPE SELECT ---------- */}
      <div ref={selectRef} className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ID Type <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setIsSelectOpen(!isSelectOpen)}
          className={`
                        w-full flex items-center justify-between px-4 py-3 sm:py-3.5
                        bg-white border-2 rounded-xl sm:rounded-2xl text-left
                        transition-all duration-200
                        ${
                          isSelectOpen
                            ? "border-blue-500 ring-4 ring-blue-500/10"
                            : "border-gray-200 hover:border-gray-300"
                        }
                    `}
        >
          {selectedOption ? (
            <span className="flex items-center gap-3">
              <span className="text-xl">{selectedOption.icon}</span>
              <span className="font-medium text-gray-900">
                {selectedOption.label}
              </span>
            </span>
          ) : (
            <span className="text-gray-400">Select your ID type...</span>
          )}
          <FiChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isSelectOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {isSelectOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-xl shadow-gray-900/10 overflow-hidden">
            <div className="max-h-64 overflow-y-auto py-2">
              {ID_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onIdTypeChange(option.value);
                    setIsSelectOpen(false);
                  }}
                  className={`
                                        w-full flex items-center gap-3 px-4 py-3 text-left
                                        transition-colors duration-150
                                        ${
                                          idType === option.value
                                            ? "bg-blue-50 text-blue-700"
                                            : "hover:bg-gray-50 text-gray-700"
                                        }
                                    `}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {idType === option.value && (
                    <FiCheckCircle className="ml-auto w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
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
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 border-2 border-emerald-200">
            <img
              src={previewUrl}
              alt="ID Preview"
              className="w-full object-contain max-h-[300px] sm:max-h-[350px]"
            />

            {/* Success badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
              <div className="bg-emerald-500 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <FiCheckCircle className="w-4 h-4" />
                {selectedOption?.label || "ID"}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={removeImage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <FiX className="w-4 h-4" />
              <span>Remove</span>
            </button>
            <button
              onClick={retakePhoto}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-200 rounded-xl font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Retake</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------- UPLOAD OPTIONS ---------- */}
      {!value && mode === "idle" && (
        <div
          className={`
                        relative rounded-xl sm:rounded-2xl border-2 border-dashed p-4 sm:p-6
                        transition-all duration-200
                        ${
                          !idType
                            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                            : isDragging
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-gray-400 bg-white"
                        }
                    `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!idType && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl sm:rounded-2xl z-10">
              <p className="text-sm text-gray-500 font-medium px-4 text-center">
                Please select an ID type first
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Upload option */}
            <label
              className={`
                                group relative flex flex-col items-center justify-center p-4 sm:p-6 
                                rounded-xl bg-gradient-to-br from-gray-50 to-gray-100
                                border-2 border-transparent
                                transition-all duration-200
                                ${
                                  idType
                                    ? "cursor-pointer hover:from-blue-50 hover:to-blue-100 hover:border-blue-200"
                                    : "cursor-not-allowed"
                                }
                            `}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:shadow-md transition-shadow">
                <FiUpload className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                Upload File
              </span>
              <span className="text-xs text-gray-400 mt-1 text-center hidden sm:block">
                JPG, PNG up to 10MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                disabled={!idType}
                onChange={handleUpload}
              />
            </label>

            {/* Camera option */}
            <button
              type="button"
              onClick={requestCamera}
              disabled={!idType}
              className={`
                                group relative flex flex-col items-center justify-center p-4 sm:p-6 
                                rounded-xl bg-gradient-to-br from-gray-50 to-gray-100
                                border-2 border-transparent
                                transition-all duration-200
                                ${
                                  idType
                                    ? "cursor-pointer hover:from-emerald-50 hover:to-emerald-100 hover:border-emerald-200"
                                    : "cursor-not-allowed"
                                }
                            `}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:shadow-md transition-shadow">
                <FiCamera className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 group-hover:text-emerald-600 transition-colors" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">
                Take Photo
              </span>
              <span className="text-xs text-gray-400 mt-1 hidden sm:block">
                Use your camera
              </span>
            </button>
          </div>

          {/* Drag & drop hint */}
          {idType && (
            <p className="text-center text-xs text-gray-400 mt-4 hidden sm:block">
              or drag and drop your ID photo here
            </p>
          )}
        </div>
      )}

      {/* ---------- CAMERA CAPTURE ---------- */}
      {mode === "capture" && (
        <div className="space-y-4">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={(error) => handleCameraError(error)}
              className="w-full aspect-[4/3] object-cover"
            />

            {/* Camera loading overlay */}
            {!cameraReady && (
              <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                <p className="text-white/80 text-sm">Starting camera...</p>
              </div>
            )}

            {/* Camera guide overlay */}
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 sm:inset-8 border-2 border-white/50 rounded-xl" />
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white/90 text-sm font-medium drop-shadow-lg px-4">
                    Position your ID within the frame
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Capture buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={cancelCamera}
              className="flex-1 px-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!cameraReady}
              onClick={handleCapture}
              className={`
                                flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 
                                rounded-xl font-semibold transition-all duration-200
                                ${
                                  cameraReady
                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }
                            `}
            >
              <FiCamera className="w-5 h-5" />
              <span>Capture</span>
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!value && mode === "idle" && idType && (
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Tips for a good photo:
          </p>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Ensure all text and photo are clearly visible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Avoid glare, shadows, or blurry images</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Include all four corners of the ID</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
