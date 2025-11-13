"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import useAuthStore from "@/zustand/authStore";

export default function NewWorkOrderModal({
    landlordId,
    onClose,
    onCreated,
}) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("General");
    const [priority, setPriority] = useState("Low");
    const [assignedTo, setAssignedTo] = useState("");
    const [description, setDescription] = useState("");
    const [photos, setPhotos] = useState([]);

    const [loading, setLoading] = useState(false);
    const { user, fetchSession } = useAuthStore();

    // NEW 🔥 Property + Units
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");

    // FETCH PROPERTIES ON LOAD
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get(
                    `/api/landlord/${landlordId}/properties`
                );
            setProperties(res.data.data || []);
            } catch (err) {
                console.error("Error fetching properties", err);
            }
        };

        fetchProperties();
    }, [landlordId]);

    // FETCH UNITS WHEN PROPERTY SELECTED
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

    const categories = ["Plumbing", "Electrical", "Aircon", "Furniture", "Appliance", "General"];
    const priorities = ["Low", "Medium", "High", "Urgent"];

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

    const handleSave = async () => {
        if (!title.trim()) {
            Swal.fire("Missing Title", "Please enter a work order title.", "warning");
            return;
        }

        if (!selectedProperty) {
            Swal.fire("Property Required", "Please select a property.", "warning");
            return;
        }

        setLoading(true);

        try {
            const photoBase64 = await Promise.all(photos.map((file) => fileToBase64(file)));

            const payload = {
                subject: title,
                category,
                priority_level: priority,
                assigned_to: assignedTo || null,
                description,
                landlord_id: landlordId,
                property_id: selectedProperty,
                unit_id: selectedUnit || null,
                photo_urls: photoBase64,
                user_id: user?.user_id
            };

            const res = await axios.post("/api/maintenance/createMaintenance/workOrder", payload);

            Swal.fire({
                icon: "success",
                title: "Created!",
                text: "New work order added.",
                timer: 1500,
                showConfirmButton: false,
            });

            onCreated(res.data.data);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to create work order.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-xl relative animate-scaleIn">

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-5">Create New Work Order</h2>

                {/* TITLE */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Title</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        placeholder="Leaking sink, AC not cooling..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* PROPERTY */}
                <div className="mb-4">
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

                {/* UNIT (Optional) */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Unit (optional)</label>
                    <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                        disabled={units.length === 0}
                    >
                        <option value="">No unit selected</option>
                        {units.map((u) => (
                            <option key={u.unit_id} value={u.unit_id}>
                                {u.unit_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* CATEGORY + PRIORITY */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                        >
                            {categories.map((c) => (
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
                            {priorities.map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ASSIGNED TO */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Assigned To (optional)</label>
                    <input
                        type="text"
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
                        <div className="grid grid-cols-3 gap-2 mt-3">
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
                <div className="flex justify-end gap-2 mt-6">
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
                        className={`px-5 py-2 rounded-lg text-white font-medium ${
                            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading ? "Saving..." : "Create Work Order"}
                    </button>
                </div>
            </div>
        </div>
    );
}
