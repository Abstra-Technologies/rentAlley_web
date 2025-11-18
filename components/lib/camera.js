"use client";

import React, { useRef } from "react";
import Webcam from "react-webcam";

export default function CameraWeb({ onCapture }) {
    const webcamRef = useRef(null);

    const capture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            onCapture(imageSrc);
        }
    };

    return (
        <div className="space-y-4">
            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full rounded-xl shadow"
                videoConstraints={{
                    facingMode: "environment",
                }}
            />

            <button
                onClick={capture}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
            >
                Capture Photo
            </button>
        </div>
    );
}
