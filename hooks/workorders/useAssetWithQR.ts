"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Html5QrcodeScanner } from "html5-qrcode";

interface UseAssetWithQROptions {
    userId?: string;
    agreementId?: string | null;
}

export function useAssetWithQR({ userId, agreementId }: UseAssetWithQROptions) {
    /* ---------------- ASSET STATE ---------------- */
    const [assetId, setAssetId] = useState("");
    const [assetDetails, setAssetDetails] = useState<any>(null);
    const [loadingAsset, setLoadingAsset] = useState(false);

    /* ---------------- QR STATE ---------------- */
    const [showScanner, setShowScanner] = useState(false);

    /* ---------------- HELPERS ---------------- */
    const extractAssetIdFromQR = (decodedText: string): string | null => {
        // Case 1: plain asset ID
        if (/^[A-Z0-9]{8,12}$/.test(decodedText)) {
            return decodedText;
        }

        // Case 2: URL containing /assets/{asset_id}
        try {
            const url = new URL(decodedText);
            const match = url.pathname.match(/\/assets\/([A-Z0-9]{8,12})/);
            if (match) return match[1];
        } catch {
            /* not a URL */
        }

        return null;
    };

    /* ---------------- FETCH ASSET ---------------- */
    useEffect(() => {
        if (!assetId.trim()) {
            setAssetDetails(null);
            return;
        }

        const fetchAsset = async () => {
            try {
                setLoadingAsset(true);
                const res = await axios.get(
                    `/api/landlord/properties/assets/detailed?asset_id=${assetId}`
                );
                setAssetDetails(res.data);
            } catch {
                setAssetDetails(null);
                Swal.fire(
                    "Asset Not Found",
                    "No asset matches this code or QR.",
                    "error"
                );
            } finally {
                setLoadingAsset(false);
            }
        };

        fetchAsset();
    }, [assetId]);

    /* ---------------- QR SCANNER ---------------- */
    useEffect(() => {
        if (!showScanner) return;

        let scanner: Html5QrcodeScanner | null = null;

        try {
            scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: 250 },
                false
            );

            scanner.render(
                async (decodedText) => {
                    const extractedAssetId = extractAssetIdFromQR(decodedText);

                    if (!extractedAssetId) {
                        Swal.fire({
                            icon: "error",
                            title: "Invalid QR Code",
                            html: `
                                <pre style="background:#f8f8f8;padding:8px;border-radius:6px;">
${decodedText}
                                </pre>
                                <p>No valid asset found.</p>
                            `,
                        });
                        return;
                    }

                    setShowScanner(false);

                    try {
                        await scanner?.clear();
                    } catch {}

                    try {
                        const assetRes = await axios.get(
                            `/api/landlord/properties/assets/detailed?asset_id=${extractedAssetId}`
                        );

                        setAssetId(extractedAssetId);
                        setAssetDetails(assetRes.data);

                        Swal.fire({
                            icon: "success",
                            title: "Asset Verified",
                            timer: 1200,
                            showConfirmButton: false,
                        });
                    } catch (err: any) {
                        Swal.fire(
                            "Access Denied",
                            err.response?.data?.error ||
                            "Unable to verify asset.",
                            "error"
                        );
                    }
                },
                () => {}
            );
        } catch {
            Swal.fire(
                "Camera Error",
                "Unable to start camera.",
                "error"
            );
        }

        return () => {
            try {
                scanner?.clear();
            } catch {}
        };
    }, [showScanner, userId, agreementId]);

    return {
        /* state */
        assetId,
        assetDetails,
        loadingAsset,
        showScanner,

        /* actions */
        setAssetId,
        setShowScanner,
        clearAsset: () => {
            setAssetId("");
            setAssetDetails(null);
        },
    };
}
