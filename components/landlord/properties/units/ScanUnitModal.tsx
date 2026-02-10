"use client";

import { useEffect, useRef, useState } from "react";
import { X, QrCode, AlertTriangle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";

function mapCameraError(err: any): string {
    const name = err?.name || err?.toString?.() || "";

    if (name.includes("NotAllowedError")) {
        return "Camera access was denied. Please allow camera permission.";
    }
    if (name.includes("NotFoundError")) {
        return "No camera device found on this device.";
    }
    if (name.includes("NotReadableError")) {
        return "Camera is currently in use by another application.";
    }
    if (name.includes("SecurityError")) {
        return "Camera access requires HTTPS.";
    }
    if (name.includes("OverconstrainedError")) {
        return "Camera does not support required constraints.";
    }

    return "Unable to access camera. Please try again or use another device.";
}

export default function ScanUnitModal({
                                          isOpen,
                                          onClose,
                                      }: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [scanned, setScanned] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setError(null);
        setScanned(false);
        setCameraReady(false);

        // Pre-flight permission check
        navigator.mediaDevices
            ?.getUserMedia({ video: true })
            .then((stream) => {
                stream.getTracks().forEach((t) => t.stop());
                setCameraReady(true);
            })
            .catch((err) => {
                console.error("[CAMERA ERROR]", err);
                setError(mapCameraError(err));
            });
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !cameraReady || error) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                aspectRatio: 1,
                qrbox: 250,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
            },
            false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                if (scanned) return;
                setScanned(true);

                try {
                    const raw = decodedText.trim();

                    let pathname: string;
                    if (raw.startsWith("http")) {
                        pathname = new URL(raw).pathname;
                    } else {
                        pathname = raw.startsWith("/") ? raw : `/${raw}`;
                    }

                    const parts = pathname
                        .split("/")
                        .map((p) => p.trim())
                        .filter(Boolean);

                    // STRICT: /unit/{unitId}/qr
                    if (
                        parts.length !== 3 ||
                        parts[0] !== "unit" ||
                        parts[2] !== "qr"
                    ) {
                        throw new Error("Invalid QR format");
                    }

                    const unitId = parts[1];

                    onClose();
                    router.push(
                        `/api/landlord/unit/qr-code/scan?unit_id=${unitId}`
                    );
                } catch (err) {
                    console.error("[QR ERROR]", err);
                    setError("This QR code is not a valid UPKYP unit.");
                    setScanned(false);
                }
            },
            (scanErr) => {
                // Handle runtime camera failures
                if (scanErr?.name) {
                    setError(mapCameraError(scanErr));
                }
            }
        );

        return () => {
            try {
                scannerRef.current?.clear();
            } catch {}
            scannerRef.current = null;
        };
    }, [isOpen, cameraReady, error, scanned, router, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-blue-600" />
                        <h2 className="text-sm font-bold text-gray-900">
                            Scan Unit QR
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {error ? (
                        <div className="flex flex-col items-center text-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    ) : (
                        <>
                            <div
                                id="qr-reader"
                                className="rounded-xl overflow-hidden border border-gray-200"
                            />
                            <p className="mt-3 text-xs text-center text-gray-500">
                                Point your camera at the unit QR code
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
