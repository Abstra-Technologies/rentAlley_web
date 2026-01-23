"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FiUpload, FiCamera, FiCheckCircle } from "react-icons/fi";

export default function StepSelfie({ value, onChange }: any) {
    const [mode, setMode] = useState<"idle" | "capture">("idle");
    const webcamRef = useRef<Webcam>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode !== "capture" && webcamRef.current?.stream) {
            webcamRef.current.stream
                .getTracks()
                .forEach((t) => t.stop());
        }
    }, [mode]);

    const handleCapture = () => {
        const img = webcamRef.current?.getScreenshot();
        if (img) {
            onChange(img);
            setMode("idle");
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">Take a Selfie</h2>
            <p className="text-sm text-gray-500">
                Make sure your face is clearly visible
            </p>

            {!value && mode === "idle" && (
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="border rounded-xl p-4 flex flex-col items-center"
                    >
                        <FiUpload className="text-2xl mb-2" />
                        Upload
                    </button>

                    <button
                        onClick={() => setMode("capture")}
                        className="border rounded-xl p-4 flex flex-col items-center"
                    >
                        <FiCamera className="text-2xl mb-2" />
                        Capture
                    </button>
                </div>
            )}

            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={(e) =>
                    e.target.files && onChange(e.target.files[0])
                }
            />

            {mode === "capture" && (
                <div className="space-y-3">
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        audio={false}
                        className="rounded-xl"
                    />
                    <button
                        onClick={handleCapture}
                        className="w-full bg-blue-600 text-white py-2 rounded-xl"
                    >
                        Take Selfie
                    </button>
                </div>
            )}

            {value && (
                <div className="text-center">
                    <FiCheckCircle className="mx-auto text-green-500 text-3xl" />
                    <p className="text-sm text-green-600 mt-2">
                        Selfie uploaded successfully
                    </p>
                </div>
            )}
        </div>
    );
}
