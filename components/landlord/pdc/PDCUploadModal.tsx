"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import Webcam from "react-webcam";
import {
    Upload,
    Building2,
    HomeIcon,
    CalendarDays,
    Brain,
    Edit3,
    Camera,
} from "lucide-react";

interface PDCUploadModalProps {
    open: boolean;
    onClose: () => void;
    landlord_id: number;
}

export default function PDCUploadModal({ open, onClose, landlord_id }: PDCUploadModalProps) {
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);

    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState<"none" | "manual" | "ai">("none");
    const [analyzing, setAnalyzing] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    const webcamRef = useRef<Webcam>(null);

    const [form, setForm] = useState({
        check_number: "",
        bank_name: "",
        amount: "",
        issue_date: "",
        notes: "",
        uploaded_image_url: "",
    });

    // Fetch landlord properties
    useEffect(() => {
        if (!open || !landlord_id) return;
        const fetchProperties = async () => {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}/properties`);
                const data = await res.json();
                setProperties(data.data || []);
            } catch (err) {
                console.error("Error fetching properties:", err);
            }
        };
        fetchProperties();
    }, [open, landlord_id]);

    // Fetch units
    useEffect(() => {
        if (!selectedProperty) return;
        const fetchUnits = async () => {
            try {
                const res = await fetch(`/api/properties/${selectedProperty}/units`);
                const data = await res.json();
                setUnits(data.data || []);
            } catch (err) {
                console.error("Error fetching units:", err);
            }
        };
        fetchUnits();
    }, [selectedProperty]);

    // Fetch active lease
    useEffect(() => {
        if (!selectedUnit) return;
        const fetchLease = async () => {
            try {
                const res = await fetch(`/api/landlord/unit/${selectedUnit}/activeLease`);
                const data = await res.json();

                if (res.ok && data.lease_id) {
                    setSelectedLeaseId(data.lease_id);
                } else {
                    setSelectedLeaseId(null);
                    Swal.fire("Warning", "No active lease found for this unit.", "warning");
                }
            } catch (err) {
                console.error("Error fetching lease:", err);
                setSelectedLeaseId(null);
            }
        };
        fetchLease();
    }, [selectedUnit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    /** ✅ Handle file upload or camera-captured image */
    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setUploading(true);

        try {
            const localUrl = URL.createObjectURL(file);
            setForm((prev) => ({ ...prev, uploaded_image_url: localUrl }));

            Swal.fire({
                icon: "info",
                title: "Uploading Check...",
                text: "Please wait while the image is being uploaded to secure storage.",
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/ai/landlord/pdcAnalyze/upload", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.url) throw new Error(uploadData.error || "Upload failed.");

            const s3Url = uploadData.url;
            setForm((prev) => ({ ...prev, uploaded_image_url: s3Url }));

            if (mode === "manual") {
                Swal.close();
                Swal.fire("Uploaded!", "Check image uploaded successfully.", "success");
                setUploading(false);
                return;
            }

            // AI analysis
            Swal.update({
                title: "Processing Check...",
                text: "Upload complete. AI is now analyzing the check image.",
            });

            const analyzeRes = await fetch("/api/ai/landlord/pdcAnalyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: s3Url }),
            });

            const aiData = await analyzeRes.json();
            Swal.close();
            setUploading(false);

            if (analyzeRes.ok) {
                Swal.fire("AI Result", aiData.recommendation || "AI analysis complete.", "info");
                setForm((prev) => ({
                    ...prev,
                    bank_name: aiData.bank_name || prev.bank_name,
                    amount: aiData.amount || prev.amount,
                    issue_date: aiData.issue_date || prev.issue_date,
                    check_number: aiData.check_number || prev.check_number,
                    notes: aiData.recommendation || prev.notes,
                }));
            } else {
                Swal.fire("AI Error", aiData.error || "Unable to analyze check.", "error");
            }
        } catch (error) {
            console.error("Upload/Analyze Error:", error);
            Swal.fire("Error", "Failed to upload or analyze check image.", "error");
        } finally {
            setUploading(false);
        }
    };

    /** 📸 Capture from Webcam */
    const handleCaptureFromCamera = async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        // Convert base64 to File for upload
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], "captured_check.jpg", { type: "image/jpeg" });
        setShowCamera(false);
        await handleFileUpload(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnit) {
            Swal.fire("Error", "Please select a unit.", "warning");
            return;
        }

        try {
            const res = await fetch("/api/landlord/pdc/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lease_id: selectedLeaseId,
                    ...form,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save PDC");

            Swal.fire("Success", "PDC recorded successfully!", "success");
            onClose();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to save PDC.", "error");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-6">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-8 overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" /> Upload New PDC
                    </h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-black text-xl font-semibold">
                        ✕
                    </button>
                </div>

                {/* Mode selection */}
                {mode === "none" && (
                    <div className="flex flex-col items-center justify-center space-y-5 py-10 text-center">
                        <p className="text-gray-700 text-sm sm:text-base font-medium">How would you like to fill this PDC?</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setMode("manual")}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium active:scale-95 text-sm sm:text-base"
                            >
                                <Edit3 className="w-4 h-4" /> Fill Manually
                            </button>

                            <button
                                onClick={() => setMode("ai")}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium active:scale-95 text-sm sm:text-base"
                            >
                                <Brain className="w-4 h-4" /> Help Me with AI
                            </button>
                        </div>
                    </div>
                )}

                {/* Form */}
                {mode !== "none" && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Property Select */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-600" /> Select Property
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => setSelectedProperty(e.target.value || null)}
                                value={selectedProperty || ""}
                                required
                            >
                                <option value="">Select Property</option>
                                {properties.map((prop) => (
                                    <option key={prop.property_id} value={prop.property_id}>
                                        {prop.property_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Unit Select */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <HomeIcon className="w-4 h-4 text-emerald-600" /> Select Unit
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                onChange={(e) => setSelectedUnit(e.target.value || null)}
                                value={selectedUnit || ""}
                                required
                                disabled={!units.length}
                            >
                                <option value="">Select Unit</option>
                                {units.map((u) => (
                                    <option key={u.unit_id} value={u.unit_id}>
                                        {u.unit_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Upload & Capture */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                {mode === "ai" ? "Upload or Capture Check" : "Upload Check Image"}
                            </label>

                            <div className="flex flex-wrap gap-3 items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                                    disabled={uploading || analyzing}
                                    className="text-sm border border-gray-300 rounded-lg p-2"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowCamera((prev) => !prev)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow hover:shadow-md transition text-sm"
                                >
                                    <Camera className="w-4 h-4" /> {showCamera ? "Close Camera" : "Capture from Camera"}
                                </button>
                            </div>

                            {showCamera && (
                                <div className="mt-3 flex flex-col items-center gap-2">
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        className="rounded-xl border border-gray-300 shadow-md w-full sm:w-96"
                                        videoConstraints={{ facingMode: "environment" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCaptureFromCamera}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition text-sm"
                                    >
                                        Capture & Upload
                                    </button>
                                </div>
                            )}

                            {form.uploaded_image_url && (
                                <img
                                    src={form.uploaded_image_url}
                                    alt="Preview"
                                    className="rounded-lg border border-gray-200 max-h-48 sm:max-h-56 object-contain mt-3 mx-auto"
                                />
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={uploading || analyzing}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium active:scale-95 text-sm sm:text-base"
                            >
                                Save PDC
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
