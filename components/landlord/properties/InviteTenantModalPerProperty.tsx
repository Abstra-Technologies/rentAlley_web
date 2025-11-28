"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function InviteTenantModal({ propertyId, onClose }) {
    const [email, setEmail] = useState("");
    const [unitId, setUnitId] = useState("");
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUnits, setLoadingUnits] = useState(true);

    // NEW
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        async function fetchUnits() {
            setLoadingUnits(true);
            try {
                const res = await axios.get(`/api/properties/${propertyId}/units`);
                setUnits(res.data.data || []);
            } catch (err) {
                console.error("Error loading units:", err);
                Swal.fire("Error", "Failed to load units. Try again.", "error");
            }
            setLoadingUnits(false);
        }

        fetchUnits();
    }, [propertyId]);

    const handleInvite = async () => {
        if (!email || !unitId || !startDate || !endDate) {
            Swal.fire("Missing Information", "All fields are required.", "warning");
            return;
        }

        if (new Date(startDate) >= new Date(endDate)) {
            Swal.fire("Invalid Dates", "End date must be after start date.", "warning");
            return;
        }

        const selectedUnit = units.find((u) => u.unit_id === unitId);
        if (!selectedUnit) {
            Swal.fire("Error", "Unit not found.", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("/api/invite", {
                email,
                unitId,
                unitName: selectedUnit.unit_name,
                startDate,
                endDate,
            });

            if (response.status === 200) {
                Swal.fire("Success!", "Invitation sent successfully!", "success");
                onClose();
            }
        } catch (err: any) {
            Swal.fire(
                "Error",
                err?.response?.data?.error || "Failed to send invite.",
                "error"
            );
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full relative">
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    ✕
                </button>

                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Invite Tenant
                </h2>

                {/* Email Input */}
                <label className="text-sm font-medium text-gray-700">Tenant Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
                    placeholder="tenant@email.com"
                />

                {/* Unit Dropdown */}
                <label className="text-sm font-medium text-gray-700">Select Unit</label>
                <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500 bg-white"
                    disabled={loadingUnits}
                >
                    <option value="">Select a unit</option>

                    {!loadingUnits &&
                        units
                            .filter((unit) => unit.status === "unoccupied")
                            .map((unit) => (
                                <option key={unit.unit_id} value={String(unit.unit_id)}>
                                    {unit.unit_name} — {unit.status}
                                </option>
                            ))}
                </select>


                {/* Start Date */}
                <label className="text-sm font-medium text-gray-700">Lease Start Date</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
                />

                {/* End Date */}
                <label className="text-sm font-medium text-gray-700">Lease End Date</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
                />

                {/* Submit Button */}
                <button
                    onClick={handleInvite}
                    disabled={loading}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-emerald-600
                    text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-emerald-700
                    transition-all disabled:opacity-50"
                >
                    {loading ? "Sending..." : "Send Invitation"}
                </button>
            </div>
        </div>
    );
}
