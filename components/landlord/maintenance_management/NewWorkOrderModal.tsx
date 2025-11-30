"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { X, Scan } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import useAuthStore from "@/zustand/authStore";

export default function NewWorkOrderModal({ landlordId, onClose, onCreated }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("General");
    const [priority, setPriority] = useState("Low");
    const [assignedTo, setAssignedTo] = useState("");
    const [description, setDescription] = useState("");
    const [photos, setPhotos] = useState([]);

    const [assetId, setAssetId] = useState(""); // 🔥 SCANNED ASSET
    const [assetDetails, setAssetDetails] = useState(null);

    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();

    // QR Scanner
    const [scannerOpen, setScannerOpen] = useState(false);
    const scannerRef = useRef(null);
    const qrDivId = "qr-reader-asset";

    // Properties & Units
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");

    // Fetch Properties
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get(`/api/landlord/${landlordId}/properties`);
                setProperties(res.data.data || []);
            } catch (err) {
                console.error("Error fetching properties", err);
            }
        };
        fetchProperties();
    }, [landlordId]);

    // Fetch Units
    useEffect(() => {
        if (!selectedProperty) {
            setUnits([]);
            setSelectedUnit("");
            return;
        }

        const fetchUnits = async () => {
            try {
                const res = await axios.get(`/api/properties/${selectedProperty}/units`);
                setUnits(res.data.data || []);
            } catch (err) {
                console.error("Error fetching units", err);
            }
        };

        fetchUnits();
    }, [selectedProperty]);

    // Categories / Priorities
    const categories = [
        "Plumbing",
        "Electrical",
        "Aircon",
        "Furniture",
        "Appliance",
        "General",
    ];
    const priorities = ["Low", "Medium", "High", "Urgent"];

    // Upload Photos
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        setPhotos([...photos, ...files]);
    };

    const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    // 🔥 Fetch Asset Details
    const fetchAssetDetails = async (scannedId) => {
        try {
            const res = await axios.get(`/api/landlord/assets_management/${scannedId}`);
            setAssetDetails(res.data.asset);
            Swal.fire("Success", "Asset recognized via QR!", "success");
        } catch {
            Swal.fire("Not Found", "Asset not found in system.", "error");
        }
    };

    // 🔥 QR Scanner Logic
    useEffect(() => {
        if (!scannerOpen) return;

        const scanner = new Html5Qrcode(qrDivId);
        scannerRef.current = scanner;

        Html5Qrcode.getCameras().then((devices) => {
            const cameraId = devices[0]?.id;

            scanner.start(
                cameraId,
                { fps: 10, qrbox: 200 },
                async (decoded) => {
                    scanner.stop();
                    setScannerOpen(false);

                    const cleanId = decoded.trim();
                    setAssetId(cleanId);

                    await fetchAssetDetails(cleanId);
                },
                () => {}
            );
        });

        return () => {
            scannerRef.current?.stop().catch(() => {});
            scannerRef.current?.clear();
        };
    }, [scannerOpen]);

    // Save Work Order
    const handleSave = async () => {
        if (!title.trim()) return Swal.fire("Missing Title", "Enter a title.", "warning");
        if (!selectedProperty) return Swal.fire("Property Required", "Select a property.", "warning");

        setLoading(true);

        try {
            const imagesEncoded = await Promise.all(
                photos.map((file) => fileToBase64(file))
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
                asset_id: assetId || null, // 🔥 SCANNED ASSET ID
                photo_urls: imagesEncoded,
                user_id: user?.user_id,
            };

            const res = await axios.post(
                "/api/maintenance/createMaintenance/workOrder",
                payload
            );

            Swal.fire("Success", "Work order created!", "success");
            onCreated(res.data.data);
        } catch (err) {
            Swal.fire("Error", "Failed to create work order.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------------------
    // UI
    // ------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div
                className="
          bg-white w-full max-w-4xl max-h-[90vh]
          overflow-y-auto scroll-smooth
          p-6 rounded-2xl shadow-2xl relative animate-scaleIn
        "
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold mb-6">Create New Work Order</h2>

                {/* Title */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Title</label>
                    <input
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        placeholder="Leaking sink, AC not cooling..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* PROPERTY + UNIT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Property */}
                    <div>
                        <label className="text-sm font-medium">Property *</label>
                        <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                        >
                            <option value="">Select a property</option>
                            {properties.map((p) => (
                                <option key={p.property_id} value={p.property_id}>
                                    {p.property_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Unit */}
                    <div>
                        <label className="text-sm font-medium">Unit (optional)</label>
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            disabled={units.length === 0}
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

                {/* SCAN ASSET */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Scan Asset (optional)</label>

                    <div className="flex gap-2 mt-1">
                        <input
                            className="flex-grow px-3 py-2 border rounded-lg"
                            value={assetId}
                            placeholder="Scan QR to auto-fill asset"
                            readOnly
                        />
                        <button
                            onClick={() => setScannerOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <Scan className="w-4 h-4" /> Scan
                        </button>
                    </div>

                    {assetDetails && (
                        <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
                            <p><strong>{assetDetails.asset_name}</strong></p>
                            <p className="text-sm text-gray-600">
                                Serial: {assetDetails.serial_number}
                            </p>
                            <p className="text-sm">Status: {assetDetails.status}</p>
                        </div>
                    )}
                </div>

                {/* QR Scanner Modal */}
                {scannerOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] p-4">
                        <div className="bg-white rounded-xl p-4 w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-3">Scan Asset QR Code</h3>
                            <div id={qrDivId} className="w-full" />
                            <button
                                onClick={() => setScannerOpen(false)}
                                className="mt-4 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* CATEGORY + PRIORITY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Category */}
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categories.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="text-sm font-medium">Priority</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            {priorities.map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Assigned */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Assigned To (optional)</label>
                    <input
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        placeholder="Technician / Vendor"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                    />
                </div>

                {/* DESCRIPTION */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue in detail..."
                    />
                </div>

                {/* PHOTOS */}
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

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`
              px-6 py-2 rounded-lg text-white font-medium
              ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
            `}
                    >
                        {loading ? "Saving..." : "Create Work Order"}
                    </button>
                </div>
            </div>
        </div>
    );
}
