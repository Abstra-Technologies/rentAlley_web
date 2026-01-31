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
          `/api/landlord/properties/assets/detailed?asset_id=${assetId}`,
        );
        setAssetDetails(res.data);
      } catch {
        setAssetDetails(null);
        Swal.fire({
          icon: "error",
          title: "Asset Not Found",
          text: "No asset matches this code or QR.",
          confirmButtonColor: "#3b82f6",
          customClass: {
            popup: "rounded-2xl",
            confirmButton: "rounded-xl px-6 py-2.5 font-semibold",
          },
        });
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
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false,
      );

      scanner.render(
        async (decodedText) => {
          const extractedAssetId = extractAssetIdFromQR(decodedText);

          if (!extractedAssetId) {
            Swal.fire({
              icon: "error",
              title: "Invalid QR Code",
              html: `
                                <div style="background:#f8fafc;padding:12px;border-radius:12px;margin-top:8px;border:1px solid #e2e8f0;">
                                    <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Scanned content:</p>
                                    <code style="font-size:13px;color:#334155;word-break:break-all;">${decodedText}</code>
                                </div>
                                <p style="margin-top:12px;color:#64748b;font-size:14px;">This doesn't appear to be a valid asset QR code.</p>
                            `,
              confirmButtonColor: "#3b82f6",
              customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-6 py-2.5 font-semibold",
              },
            });
            return;
          }

          setShowScanner(false);

          try {
            await scanner?.clear();
          } catch {}

          try {
            const assetRes = await axios.get(
              `/api/landlord/properties/assets/detailed?asset_id=${extractedAssetId}`,
            );

            setAssetId(extractedAssetId);
            setAssetDetails(assetRes.data);

            Swal.fire({
              icon: "success",
              title: "Asset Verified",
              html: `
                                <div style="background:linear-gradient(135deg,#ecfdf5,#f0fdf4);padding:16px;border-radius:12px;margin-top:8px;border:1px solid #bbf7d0;">
                                    <p style="font-size:14px;color:#166534;font-weight:600;">${assetRes.data?.asset_name || extractedAssetId}</p>
                                    <p style="font-size:12px;color:#15803d;margin-top:4px;">ID: ${extractedAssetId}</p>
                                </div>
                            `,
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
              customClass: {
                popup: "rounded-2xl",
              },
            });
          } catch (err: any) {
            Swal.fire({
              icon: "error",
              title: "Access Denied",
              text:
                err.response?.data?.error ||
                "Unable to verify asset. This asset may not belong to your property.",
              confirmButtonColor: "#3b82f6",
              customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-6 py-2.5 font-semibold",
              },
            });
          }
        },
        () => {},
      );
    } catch {
      Swal.fire({
        icon: "error",
        title: "Camera Error",
        text: "Unable to access your camera. Please check your browser permissions and try again.",
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "rounded-xl px-6 py-2.5 font-semibold",
        },
      });
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
