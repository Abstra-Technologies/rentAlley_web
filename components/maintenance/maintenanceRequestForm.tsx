"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_CATEGORIES } from "@/constant/maintenanceCategories";
import { Html5QrcodeScanner } from "html5-qrcode";

import {
    WrenchScrewdriverIcon,
    XMarkIcon,
    CloudArrowUpIcon,
    CheckCircleIcon,
    HomeIcon,
    BuildingOffice2Icon,
    WrenchIcon,
    QrCodeIcon,
} from "@heroicons/react/24/outline";
import { BackButton } from "../navigation/backButton";

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                  */
/* -------------------------------------------------------------------------- */
const maintenanceSchema = z.object({
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
});

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                   */
/* -------------------------------------------------------------------------- */
export default function MaintenanceRequestForm() {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const agreement_id = searchParams.get("agreement_id");

    /* ----------------------------- ASSET STATE ------------------------------ */
    const [assetId, setAssetId] = useState("");
    const [assetDetails, setAssetDetails] = useState<any>(null);
    const [loadingAsset, setLoadingAsset] = useState(false);

    /* ----------------------------- FORM STATE ------------------------------- */
    const [selectedCategory, setSelectedCategory] = useState("");
    const [description, setDescription] = useState("");
    const [isEmergency, setIsEmergency] = useState(false);

    const [photos, setPhotos] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ----------------------------- QR STATE --------------------------------- */
    const [showScanner, setShowScanner] = useState(false);

    const logQR = (...args: any[]) => {
        if (process.env.NODE_ENV === "production") {
            console.log("[QR_SCAN]", ...args);
        }
    };

    const extractAssetIdFromQR = (decodedText: string): string | null => {
        console.log("[QR] Attempting to extract asset ID from:", decodedText);

        // Case 1: QR is just the asset ID
        if (/^[A-Z0-9]{8,12}$/.test(decodedText)) {
            console.log("[QR] QR is plain asset ID");
            return decodedText;
        }

        // Case 2: QR is a URL containing /assets/{asset_id}
        try {
            const url = new URL(decodedText);
            const match = url.pathname.match(/\/assets\/([A-Z0-9]{8,12})/);
            if (match) {
                console.log("[QR] Asset ID extracted from URL:", match[1]);
                return match[1];
            }
        } catch (err) {
            console.warn("[QR] Decoded text is not a valid URL");
        }

        console.error("[QR] Failed to extract asset ID");
        return null;
    };



    /* -------------------------------------------------------------------------- */
    /* FETCH ASSET DETAILS                                                        */
    /* -------------------------------------------------------------------------- */
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
                Swal.fire("Asset Not Found", "No asset matches this QR / code.", "error");
            } finally {
                setLoadingAsset(false);
            }
        };

        fetchAsset();
    }, [assetId]);

    /* -------------------------------------------------------------------------- */
    /* QR SCANNER                                                                 */
    /* -------------------------------------------------------------------------- */
    useEffect(() => {
        if (!showScanner) {
            console.log("[QR] Scanner not shown, skipping init");
            return;
        }

        let scanner: Html5QrcodeScanner | null = null;

        console.log("[QR] Initializing scanner…", {
            user_id: user?.user_id,
            agreement_id,
        });

        try {
            scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: 250 },
                false
            );

            console.log("[QR] Scanner instance created");

            scanner.render(
                async (decodedText) => {
                    console.log("[QR] ✅ QR detected");
                    console.log("[QR] Raw decoded text:", decodedText);

                    // 1️⃣ Extract asset ID (supports ID or URL)
                    const extractedAssetId = extractAssetIdFromQR(decodedText);

                    if (!extractedAssetId) {
                        console.error("[QR] ❌ Invalid QR format:", decodedText);

                        Swal.fire({
                            icon: "error",
                            title: "Invalid QR Code",
                            html: `
<b>Scanned value:</b>
<pre style="background:#f8f8f8;padding:8px;border-radius:6px;max-height:120px;overflow:auto;">
${decodedText}
</pre>
<p>This QR code does not contain a valid asset.</p>
                        `,
                        });
                        return;
                    }

                    console.log("[QR] Extracted asset ID:", extractedAssetId);

                    // 2️⃣ Close scanner immediately
                    console.log("[QR] Closing scanner UI…");
                    setShowScanner(false);

                    try {
                        await scanner?.clear();
                        console.log("[QR] Scanner successfully cleared");
                    } catch (clearErr) {
                        console.warn("[QR] Scanner clear warning:", clearErr);
                    }

                    // 3️⃣ VERIFY ASSET USING EXISTING API
                    try {
                        console.log("[QR] 🔄 Verifying asset via detailed API", {
                            asset_id: extractedAssetId,
                        });

                        const assetRes = await axios.get(
                            `/api/landlord/properties/assets/detailed?asset_id=${extractedAssetId}`
                        );

                        console.log("[QR] Asset verification response:", assetRes.data);

                        if (!assetRes.data) {
                            Swal.fire(
                                "Asset Not Found",
                                "This asset does not exist or you do not have access.",
                                "error"
                            );
                            return;
                        }

                        // 4️⃣ Asset verified → set state
                        console.log("[QR] ✅ Asset verified, setting assetId");
                        setAssetId(extractedAssetId);
                        setAssetDetails(assetRes.data); // avoid double fetch

                        Swal.fire({
                            icon: "success",
                            title: "Asset Verified",
                            text: "Asset information loaded successfully.",
                            timer: 1200,
                            showConfirmButton: false,
                        });

                    } catch (err: any) {
                        console.error("[QR] ❌ Asset verification failed", {
                            error: err,
                            response: err?.response,
                        });

                        Swal.fire(
                            "Access Denied",
                            err.response?.data?.error ||
                            "Unable to verify asset. You may not have access.",
                            "error"
                        );
                    }
                },
                (scanError) => {
                    console.warn("[QR] Scanner runtime warning:", scanError);
                }
            );

            console.log("[QR] Scanner render started");

        } catch (err) {
            console.error("[QR] ❌ Scanner initialization failed", err);

            Swal.fire(
                "Camera Error",
                "Unable to start camera. Please check permissions.",
                "error"
            );
        }

        return () => {
            console.log("[QR] Cleaning up scanner…");
            try {
                scanner?.clear();
                console.log("[QR] Scanner cleanup complete");
            } catch (cleanupErr) {
                console.warn("[QR] Scanner cleanup warning:", cleanupErr);
            }
        };
    }, [showScanner, user?.user_id, agreement_id]);

    /* -------------------------------------------------------------------------- */
    /* FILE HANDLING                                                              */
    /* -------------------------------------------------------------------------- */
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const images = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith("image/")
        );
        setPhotos((prev) => [...prev, ...images]);
    };

    /* -------------------------------------------------------------------------- */
    /* SUBMIT                                                                     */
    /* -------------------------------------------------------------------------- */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validation = maintenanceSchema.safeParse({
            category: selectedCategory,
            description,
        });

        if (!validation.success) {
            setIsSubmitting(false);
            Swal.fire("Missing Fields", "Please complete required fields.", "error");
            return;
        }

        try {
            const fd = new FormData();
            fd.append("agreement_id", agreement_id || "");
            fd.append("category", selectedCategory);
            fd.append("subject", selectedCategory);
            fd.append("description", description);
            fd.append("is_emergency", isEmergency ? "1" : "0");
            fd.append("user_id", user?.user_id || "");
            if (assetId) fd.append("asset_id", assetId);
            photos.forEach((p) => fd.append("photos", p));

            const res = await axios.post("/api/maintenance/createMaintenance", fd);

            if (res.data?.success) {
                Swal.fire("Submitted!", "Maintenance request sent.", "success").then(
                    () =>
                        router.push(
                            `/pages/tenant/maintenance?agreement_id=${agreement_id}`
                        )
                );
            }
        } catch {
            Swal.fire("Error", "Submission failed.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* -------------------------------------------------------------------------- */
    /* UI                                                                         */
    /* -------------------------------------------------------------------------- */
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-6">
                <div className="max-w-4xl lg:max-w-3xl xl:max-w-2xl mx-auto">
                    <BackButton label="Back to Requests" />

                    <div className="bg-white rounded-2xl border shadow-sm mt-5 overflow-hidden">
                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-6 text-white flex items-center gap-3">
                            <WrenchScrewdriverIcon className="w-6 h-6" />
                            <h1 className="text-xl font-bold">Maintenance Request</h1>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-5 sm:p-6 space-y-6"
                        >
                            {/* ASSET CODE + QR */}
                            <div>
                                <label className="text-sm font-semibold text-gray-800">
                                    Asset Code (optional)
                                </label>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        value={assetId}
                                        onChange={(e) => setAssetId(e.target.value)}
                                        className="flex-1 px-4 py-2.5 text-sm border rounded-xl"
                                        placeholder="Enter or scan asset code"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        <QrCodeIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {loadingAsset && (
                                <p className="text-sm text-blue-600">Loading asset…</p>
                            )}

                            {/* ASSET INFO */}
                            {assetDetails && (
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-xl text-sm space-y-3">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <WrenchIcon className="w-5 h-5 text-blue-600" />
                                        Asset Information
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <p><b>ID:</b> {assetDetails.asset_id}</p>
                                        <p><b>Name:</b> {assetDetails.asset_name}</p>
                                        <p><b>Category:</b> {assetDetails.category || "—"}</p>
                                        <p><b>Model:</b> {assetDetails.model || "—"}</p>
                                        <p><b>Manufacturer:</b> {assetDetails.manufacturer || "—"}</p>
                                        <p><b>Serial:</b> {assetDetails.serial_number || "—"}</p>
                                        <p className="capitalize"><b>Status:</b> {assetDetails.status}</p>
                                        <p className="capitalize"><b>Condition:</b> {assetDetails.condition}</p>
                                    </div>

                                    <div className="pt-2 border-t border-blue-200">
                                        <b>Assigned To:</b>{" "}
                                        {assetDetails.unit_name ? (
                                            <span className="inline-flex items-center gap-1 text-blue-700">
                        <HomeIcon className="w-4 h-4" />
                                                {assetDetails.unit_name}
                      </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-gray-700">
                        <BuildingOffice2Icon className="w-4 h-4" />
                        Property-level asset
                      </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* CATEGORY */}
                            <div>
                                <label className="text-sm font-semibold text-gray-800">
                                    Problem Type *
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                    {MAINTENANCE_CATEGORIES.map((item) => {
                                        const Icon = item.icon;
                                        const active = selectedCategory === item.value;
                                        return (
                                            <button
                                                type="button"
                                                key={item.value}
                                                onClick={() => setSelectedCategory(item.value)}
                                                className={`h-24 sm:h-28 lg:h-20 flex flex-col items-center justify-center rounded-xl border ${
                                                    active
                                                        ? "bg-blue-50 border-blue-500"
                                                        : "bg-white border-gray-200"
                                                }`}
                                            >
                                                <Icon className="w-6 h-6 text-blue-600 mb-1" />
                                                <span className="text-xs sm:text-sm font-semibold">
                          {item.label}
                        </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="text-sm font-semibold text-gray-800">
                                    Description *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-2 w-full p-4 text-sm border rounded-xl min-h-[140px]"
                                />
                            </div>

                            {/* EMERGENCY */}
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border">
                                <div>
                                    <p className="font-semibold text-sm">Emergency?</p>
                                    <p className="text-xs text-gray-600">
                                        Requires immediate attention
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isEmergency}
                                    onChange={() => setIsEmergency(!isEmergency)}
                                    className="w-5 h-5 accent-red-600"
                                />
                            </div>

                            {/* UPLOAD */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActive(true);
                                }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-6 text-center ${
                                    dragActive ? "bg-blue-50" : ""
                                }`}
                            >
                                <label className="cursor-pointer">
                                    <CloudArrowUpIcon className="w-8 h-8 mx-auto text-blue-600" />
                                    <p className="text-sm mt-2">Upload photos</p>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* SUBMIT */}
                            <button
                                type="submit"
                                disabled={isSubmitting || (!!assetId && !assetDetails)}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                {isSubmitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* QR MODAL */}
            {showScanner && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-4 w-full max-w-sm">
                        <div className="flex justify-between mb-2">
                            <h3 className="font-semibold">Scan Asset QR</h3>
                            <button onClick={() => setShowScanner(false)}>
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div id="qr-reader" />
                    </div>
                </div>
            )}
        </div>
    );
}
