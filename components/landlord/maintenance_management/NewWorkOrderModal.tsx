"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { X, Scan } from "lucide-react";
import useAuthStore from "@/zustand/authStore";

import { useAssetWithQR } from "@/hooks/workorders/useAssetWithQR";

export default function NewWorkOrderModal({
                                              landlordId,
                                              onClose,
                                              onCreated,
                                          }: {
    landlordId: number | string;
    onClose: () => void;
    onCreated: (data: any) => void;
}) {
    const { user } = useAuthStore();

    /* ---------------- BASIC STATE ---------------- */
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("General");
    const [priority, setPriority] = useState("Low");
    const [assignedTo, setAssignedTo] = useState("");
    const [description, setDescription] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);

    /* ---------------- ASSET + QR (HOOK) ---------------- */
    const {
        assetId,
        assetDetails,
        loadingAsset,
        showScanner,
        setAssetId,
        setShowScanner,
    } = useAssetWithQR({
        userId: user?.user_id,
    });

    /* ---------------- PROPERTY / UNIT ---------------- */
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");

    /* ---------------- FETCH PROPERTIES ---------------- */
    useEffect(() => {
        if (!user?.landlord_id) return;

        const fetchProperties = async () => {
            try {
                const res = await axios.get(
                    `/api/landlord/${user.landlord_id}/properties`
                );
                setProperties(res.data.data || []);
            } catch (err) {
                console.error("Error fetching properties", err);
            }
        };

        fetchProperties();
    }, [user?.landlord_id]);

    /* ---------------- FETCH UNITS ---------------- */
    useEffect(() => {
        if (!selectedProperty) {
            setUnits([]);
            setSelectedUnit("");
            return;
        }

        const fetchUnits = async () => {
            try {
                const res = await axios.get(
                    `/api/properties/${selectedProperty}/units`
                );
                setUnits(res.data.data || []);
            } catch (err) {
                console.error("Error fetching units", err);
            }
        };

        fetchUnits();
    }, [selectedProperty]);

    /* ---------------- PHOTO UPLOAD ---------------- */
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setPhotos((prev) => [...prev, ...Array.from(e.target.files)]);
    };

    const fileToBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    /* ---------------- SAVE ---------------- */
    const handleSave = async () => {
        if (!title.trim()) {
            return Swal.fire(
                "Missing Title",
                "Enter a work order title.",
                "warning"
            );
        }

        if (!selectedProperty) {
            return Swal.fire(
                "Property Required",
                "Select a property.",
                "warning"
            );
        }

        setLoading(true);

        try {
            const encodedPhotos = await Promise.all(
                photos.map((f) => fileToBase64(f))
            );

            const payload = {
                subject: title,
                category,
                priority_level: priority,
                assigned_to: assignedTo || null,
                description,
                landlord_id: landlordId,
                property_id: selectedProperty,
                unit_id: selectedUnit || null,
                asset_id: assetId || null,
                photo_urls: encodedPhotos,
                user_id: user?.user_id,
            };

            const res = await axios.post(
                `/api/maintenance/createMaintenance/workOrder`,
                payload
            );

            Swal.fire("Success", "Work order created!", "success");
            onCreated(res.data.data);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to create work order.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl relative">

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold mb-6">
                    Create New Work Order
                </h2>

                {/* Title */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Title</label>
                    <input
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Leaking sink, AC not cooling..."
                    />
                </div>

                {/* Property + Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm font-medium">Property *</label>
                        <select
                            value={selectedProperty}
                            onChange={(e) =>
                                setSelectedProperty(e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                        >
                            <option value="">Select a property</option>
                            {properties.map((p) => (
                                <option
                                    key={p.property_id}
                                    value={p.property_id}
                                >
                                    {p.property_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">
                            Unit (optional)
                        </label>
                        <select
                            value={selectedUnit}
                            onChange={(e) =>
                                setSelectedUnit(e.target.value)
                            }
                            disabled={!units.length}
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                        >
                            <option value="">No unit selected</option>
                            {units.map((u) => (
                                <option key={u.unit_id} value={u.unit_id}>
                                    {u.unit_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Asset + QR */}
                <div className="mb-4">
                    <label className="text-sm font-medium">
                        Asset ID (optional)
                    </label>

                    <div className="flex gap-2 mt-1">
                        <input
                            className="flex-grow px-3 py-2 border rounded-lg"
                            value={assetId}
                            onChange={(e) => setAssetId(e.target.value)}
                            placeholder="Scan QR or type Asset ID"
                        />

                        <button
                            onClick={() => setShowScanner(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Scan className="w-4 h-4" />
                            Scan
                        </button>
                    </div>

                    {loadingAsset && (
                        <p className="text-sm text-blue-600 mt-1">
                            Loading asset…
                        </p>
                    )}

                    {assetDetails && (
                        <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
                            <p className="font-semibold">
                                {assetDetails.asset_name}
                            </p>
                            <p className="text-sm text-gray-600">
                                Serial: {assetDetails.serial_number}
                            </p>
                            <p className="text-sm capitalize">
                                Status: {assetDetails.status}
                            </p>
                        </div>
                    )}
                </div>

                {/* Category + Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                        >
                            {[
                                "Plumbing",
                                "Electrical",
                                "Aircon",
                                "Furniture",
                                "Appliance",
                                "General",
                            ].map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                        >
                            {["Low", "Medium", "High", "Urgent"].map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Assigned */}
                <div className="mb-4">
                    <label className="text-sm font-medium">
                        Assigned To (optional)
                    </label>
                    <input
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="Technician / Vendor"
                    />
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue..."
                    />
                </div>

                {/* Photos */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Photos</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="mt-1"
                    />

                    {photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                            {photos.map((file, idx) => (
                                <img
                                    key={idx}
                                    src={URL.createObjectURL(file)}
                                    className="h-20 w-full object-cover rounded-lg border"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`px-6 py-2 rounded-lg text-white font-medium ${
                            loading
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading ? "Saving..." : "Create Work Order"}
                    </button>
                </div>
            </div>

            {/* QR MODAL */}
            {showScanner && (
                <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-4 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-3">
                            Scan Asset QR Code
                        </h3>
                        <div id="qr-reader" />
                        <button
                            onClick={() => setShowScanner(false)}
                            className="mt-4 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
