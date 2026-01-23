"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
    FiUpload,
    FiCamera,
    FiCheckCircle,
    FiX,
    FiAlertTriangle,
} from "react-icons/fi";

type Mode = "idle" | "capture";

interface StepIDProps {
    value: File | null;
    idType: string;
    onChange: (file: File | null) => void;
    onIdTypeChange: (type: string) => void;
}

const ID_OPTIONS = [
    "Passport",
    "Driver’s License",
    "UMID",
    "PhilSys (National ID)",
    "PRC ID",
    "Postal ID",
    "Voter’s ID",
];

export default function StepID({
                                   value,
                                   idType,
                                   onChange,
                                   onIdTypeChange,
                               }: StepIDProps) {
    const [mode, setMode] = useState<Mode>("idle");
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            webcamRef.current?.stream
                ?.getTracks()
                .forEach((track) => track.stop());
        };
    }, []);

    /* ---------- CAMERA ---------- */
    const requestCamera = async () => {
        if (!idType) return;

        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraError(null);
            setMode("capture");
        } catch {
            setCameraError("Camera permission denied.");
        }
    };

    const handleCapture = useCallback(() => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setCameraError("Failed to capture image.");
            return;
        }

        fetch(imageSrc)
            .then((res) => res.blob())
            .then((blob) => {
                const file = new File(
                    [blob],
                    `id-${idType}-${Date.now()}.jpg`,
                    { type: "image/jpeg" }
                );
                onChange(file);
                setMode("idle");
            });
    }, [onChange, idType]);

    /* ---------- FILE UPLOAD ---------- */
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Only image files allowed.");
            return;
        }

        onChange(file);
        setMode("idle");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeImage = () => {
        onChange(null);
        setCameraError(null);
    };

    return (
        <div className="space-y-6 max-w-md mx-auto px-2 pb-10">
            <div>
                <p className="text-sm text-gray-600">
                    Select your ID type and upload a clear photo
                </p>
            </div>

            {/* ---------- ID TYPE SELECT ---------- */}
            <div>
                <label className="block text-sm font-medium mb-1">
                    ID Type
                </label>
                <select
                    value={idType}
                    onChange={(e) => onIdTypeChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select ID type</option>
                    {ID_OPTIONS.map((id) => (
                        <option key={id} value={id}>
                            {id}
                        </option>
                    ))}
                </select>
            </div>

            {/* ---------- PREVIEW ---------- */}
            {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border">
                    <img
                        src={previewUrl}
                        alt="ID Preview"
                        className="w-full object-contain max-h-[420px]"
                    />

                    <button
                        onClick={removeImage}
                        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow"
                    >
                        <FiX />
                    </button>

                    <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <FiCheckCircle />
                        {idType}
                    </div>
                </div>
            )}

            {/* ---------- ERROR ---------- */}
            {cameraError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                    <FiAlertTriangle className="mx-auto text-red-500 text-3xl mb-2" />
                    <p className="text-red-700">{cameraError}</p>
                </div>
            )}

            {/* ---------- ACTIONS ---------- */}
            {!value && mode === "idle" && (
                <div className="grid grid-cols-2 gap-4">
                    <label
                        className={`border-dashed border-2 rounded-xl p-6 text-center cursor-pointer ${
                            !idType && "opacity-50 cursor-not-allowed"
                        }`}
                    >
                        <FiUpload className="mx-auto text-3xl mb-2" />
                        Upload
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={!idType}
                            onChange={handleUpload}
                        />
                    </label>

                    <button
                        onClick={requestCamera}
                        disabled={!idType}
                        className={`border-dashed border-2 rounded-xl p-6 text-center ${
                            !idType && "opacity-50 cursor-not-allowed"
                        }`}
                    >
                        <FiCamera className="mx-auto text-3xl mb-2" />
                        Take Photo
                    </button>
                </div>
            )}

            {/* ---------- CAMERA ---------- */}
            {mode === "capture" && (
                <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden border">
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "environment" }}
                            onUserMedia={() => setCameraReady(true)}
                            onUserMediaError={() =>
                                setCameraError("Unable to access camera.")
                            }
                            className="w-full aspect-video object-cover"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            disabled={!cameraReady}
                            onClick={handleCapture}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl disabled:opacity-50"
                        >
                            Capture
                        </button>
                        <button
                            onClick={() => setMode("idle")}
                            className="flex-1 border py-3 rounded-xl"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
