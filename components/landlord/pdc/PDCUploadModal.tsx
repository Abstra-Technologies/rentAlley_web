"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    Upload,
    Building2,
    HomeIcon,
    CalendarDays,
    Brain,
    Edit3,
} from "lucide-react";

interface PDCUploadModalProps {
    open: boolean;
    onClose: () => void;
    landlord_id: number;
}

export default function PDCUploadModal({ open, onClose, landlord_id }: PDCUploadModalProps) {
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState<"none" | "manual" | "ai">("none");
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);

    const [form, setForm] = useState({
        check_number: "",
        bank_name: "",
        amount: "",
        issue_date: "",
        notes: "",
        uploaded_image_url: "",
    });

    // Fetch landlord properties on modal open
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

    // Fetch units when property changes
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

    // Fetch active lease for selected unit
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);

        try {
            // 1️⃣ Local preview for user feedback
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

            // 2️⃣ Upload to S3 via your API route
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/ai/landlord/pdcAnalyze/upload", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.url) {
                throw new Error(uploadData.error || "Failed to upload check image.");
            }

            const s3Url = uploadData.url;

            // ✅ Update form with permanent URL
            setForm((prev) => ({ ...prev, uploaded_image_url: s3Url }));

            // 🧭 Branch logic depending on mode
            if (mode === "manual") {
                Swal.close();
                setUploading(false);
                Swal.fire("Uploaded!", "Check image uploaded successfully.", "success");
                return; // Stop here — no AI analysis
            }

            // 3️⃣ Only for AI mode
            Swal.update({
                title: "Processing Check...",
                text: "Upload complete. AI is now analyzing the check image for legibility and compliance.",
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
                // 🔢 Confidence and feedback
                const score = aiData.legibility_score ?? 0;
                let confidenceLabel = "Low Confidence";
                let icon = "error";
                let color = "#dc2626"; // red

                if (score >= 0.85) {
                    confidenceLabel = "High Confidence";
                    icon = "success";
                    color = "#16a34a";
                } else if (score >= 0.7) {
                    confidenceLabel = "Moderate Confidence";
                    icon = "warning";
                    color = "#eab308";
                }

                // 🧠 Display AI Summary
                Swal.fire({
                    icon,
                    title: "AI Analysis Result",
                    html: `
          <div style="text-align:left;">
            <b>Legibility Score:</b>
            <span style="color:${color}; font-weight:bold;">
              ${(score * 100).toFixed(0)}% (${confidenceLabel})
            </span><br/><br/>

            <b>Issues Found:</b>
            <ul style="margin-top:5px;">
              ${
                        aiData.issues?.length
                            ? aiData.issues.map((i: string) => `<li>• ${i}</li>`).join("")
                            : "<li>None detected</li>"
                    }
            </ul>

            <b>Recommendation:</b><br/>
            <p style="margin-top:5px;">${aiData.recommendation}</p>
          </div>
        `,
                });

                // ✅ Prefill detected fields
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
            console.error("Error uploading or analyzing image:", error);
            Swal.close();
            Swal.fire("Error", "Failed to upload or analyze check image.", "error");
            setUploading(false);
        }
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
                    check_number: form.check_number,
                    bank_name: form.bank_name,
                    amount: form.amount,
                    issue_date: formatForStorage(form.issue_date),
                    notes: form.notes,
                    uploaded_image_url: form.uploaded_image_url,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save PDC");

            Swal.fire("Success", "PDC recorded successfully!", "success");
            onClose();

            // Reset after success
            setForm({
                check_number: "",
                bank_name: "",
                amount: "",
                issue_date: "",
                notes: "",
                uploaded_image_url: "",
            });
            setSelectedProperty(null);
            setSelectedUnit(null);
            setUnits([]);
            setMode("none");
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to save PDC.", "error");
        }
    };

    const handleCancel = async () => {
        // If there’s an uploaded file, delete it from S3
        if (form.uploaded_image_url) {
            try {
                Swal.fire({
                    icon: "info",
                    title: "Deleting uploaded file...",
                    text: "Please wait while we remove the temporary image from S3.",
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

                await fetch("/api/ai/landlord/pdcAnalyze/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileUrl: form.uploaded_image_url }),
                });

                Swal.close();
            } catch (err) {
                console.error("Failed to delete temporary file:", err);
                Swal.close();
            }
        }

        // Reset form and state
        setForm({
            check_number: "",
            bank_name: "",
            amount: "",
            issue_date: "",
            notes: "",
            uploaded_image_url: "",
        });
        setSelectedProperty(null);
        setSelectedUnit(null);
        setUnits([]);
        setMode("none");

        onClose();
    };


    // Converts MM-DD-YYYY → YYYY-MM-DD for the date input
    const formatForInput = (dateStr: string) => {
        if (!dateStr) return "";
        const [mm, dd, yyyy] = dateStr.split("-");
        if (!mm || !dd || !yyyy) return "";
        return `${yyyy}-${mm}-${dd}`;
    };

// ✅ Ensures consistent YYYY-MM-DD format (for saving/submission)
    const formatForStorage = (dateStr: string) => {
        if (!dateStr) return "";
        const [yyyy, mm, dd] = dateStr.split("-");
        if (!yyyy || !mm || !dd) return "";
        return `${yyyy}-${mm}-${dd}`; // ✅ Keep ISO / MySQL-compatible order
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" /> Upload New PDC
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-red-600 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-800 font-semibold"
                        >
                            ✕
                        </button>
                    </div>
                </div>


                {/* Mode Selection Step */}
                {mode === "none" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-6">
                        <p className="text-gray-700 text-sm font-medium">
                            How would you like to fill this PDC?
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setMode("manual")}
                                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium active:scale-95"
                            >
                                <Edit3 className="w-4 h-4" />
                                Fill Manually
                            </button>

                            <button
                                onClick={() => setMode("ai")}
                                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium active:scale-95"
                            >
                                <Brain className="w-4 h-4" />
                                Help Me with AI
                            </button>
                        </div>
                    </div>
                )}

                {/* Form Section */}
                {mode !== "none" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Property */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-600" /> Select Property
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                onChange={(e) => setSelectedProperty(Number(e.target.value))}
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

                        {/* Unit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <HomeIcon className="w-4 h-4 text-emerald-600" /> Select Unit
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                onChange={(e) => setSelectedUnit(Number(e.target.value))}
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

                        {/* Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {mode === "ai" ? "Upload Check for AI Analysis" : "Upload Check Image"}
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading || analyzing}
                                className="w-full text-sm border border-gray-300 rounded-lg p-2"
                            />
                            {form.uploaded_image_url && (
                                <div className="mt-3 relative">
                                    <img
                                        src={form.uploaded_image_url}
                                        alt="Check Preview"
                                        className="rounded-lg border border-gray-200 max-h-40 object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const confirm = await Swal.fire({
                                                title: "Delete uploaded check?",
                                                text: "This will permanently remove the image from storage.",
                                                icon: "warning",
                                                showCancelButton: true,
                                                confirmButtonText: "Yes, delete it",
                                                cancelButtonText: "Cancel",
                                            });
                                            if (!confirm.isConfirmed) return;

                                            try {
                                                Swal.fire({
                                                    icon: "info",
                                                    title: "Deleting image...",
                                                    text: "Please wait while we remove the file from S3.",
                                                    showConfirmButton: false,
                                                    allowOutsideClick: false,
                                                    didOpen: () => Swal.showLoading(),
                                                });

                                                const res = await fetch("/api/ai/landlord/pdcAnalyze/delete", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ fileUrl: form.uploaded_image_url }),
                                                });

                                                Swal.close();

                                                if (!res.ok) {
                                                    throw new Error("Failed to delete image.");
                                                }

                                                Swal.fire("Deleted!", "The image was successfully removed.", "success");
                                                setForm((prev) => ({ ...prev, uploaded_image_url: "" }));
                                            } catch (error) {
                                                console.error(error);
                                                Swal.fire("Error", "Failed to delete the image from S3.", "error");
                                            }
                                        }}
                                        className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md shadow hover:bg-red-700 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}

                            {analyzing && (
                                <p className="text-xs text-gray-500 mt-2 animate-pulse">
                                    🔍 Analyzing check handwriting and legibility...
                                </p>
                            )}
                        </div>

                        {/* Manual Fields (always visible in AI mode for review) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Check Number
                                </label>
                                <input
                                    type="text"
                                    name="check_number"
                                    value={form.check_number}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={form.bank_name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (₱)
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <CalendarDays className="w-4 h-4 text-emerald-500" /> Due Date
                                </label>

                                <input
                                    type="date"
                                    name="issue_date"
                                    value={form.issue_date || ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            issue_date: e.target.value,
                                        }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    required
                                />

                                <p className="text-xs text-gray-500 mt-1">
                                    Format: <strong>YYYY-MM-DD</strong> (e.g., 2025-11-05)
                                </p>
                            </div>



                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes / AI Recommendation
                            </label>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none"
                                placeholder={
                                    mode === "ai"
                                        ? "AI will suggest corrections or recommendations..."
                                        : "Additional remarks..."
                                }
                            />
                        </div>

                        {/* Submit */}
                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={uploading || analyzing}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium active:scale-95"
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
