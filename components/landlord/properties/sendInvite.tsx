

"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function SendTenantInviteModal({ landlord_id }: { landlord_id: number }) {
    const [open, setOpen] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [loading, setLoading] = useState(false);

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

    const handleSendInvite = async () => {
        if (!selectedProperty || !selectedUnit || !inviteEmail) {
            Swal.fire("Error", "Please select property, unit, and enter email.", "error");
            return;
        }

        setLoading(true);

        try {
            const property = properties.find((p) => p.property_id === parseInt(selectedProperty));
            const unit = units.find((u) => u.unit_id === parseInt(selectedUnit));

            const res = await fetch("/api/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: inviteEmail,
                    unitId: selectedUnit,
                    propertyName: property?.property_name || "",
                    unitName: unit?.unit_name || "",
                }),
            });

            const data = await res.json();

            if (data.success) {
                Swal.fire("✅ Sent!", `Invitation email sent to ${inviteEmail}.`, "success");
                setInviteEmail("");
                setSelectedProperty("");
                setSelectedUnit("");
                setOpen(false);
            } else {
                Swal.fire("Error", data.error || "Could not send invite.", "error");
            }
        } catch (err) {
            console.error("Invite error:", err);
            Swal.fire("Error", "Something went wrong. Try again later.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="w-full sm:w-auto px-8 py-5
             bg-gradient-to-br from-blue-950/90 via-teal-900/80 to-emerald-900/80
             text-white rounded-2xl font-semibold shadow-md
             hover:opacity-95 hover:shadow-lg transition-all text-left"
            >
                <div className="flex flex-col items-start">
                    <span className="text-lg font-bold">➕ Invite Tenant</span>
                    <span className="text-sm font-normal text-gray-200">
      Send an invitation to join and manage their lease.
    </span>
                </div>
            </button>



            {/* Modal */}
            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Tenant Invite</h2>

                        {/* Property Selector */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                        <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">Select Property</option>
                            {properties.map((p) => (
                                <option key={p.property_id} value={p.property_id}>
                                    {p.property_name}
                                </option>
                            ))}
                        </select>

                        {/* Unit Selector */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-400"
                            disabled={!selectedProperty}
                        >
                            <option value="">Select Unit</option>
                            {units.map((u) => (
                                <option key={u.unit_id} value={u.unit_id}>
                                    {u.unit_name}
                                </option>
                            ))}
                        </select>

                        {/* Email Input */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Email</label>
                        <input
                            type="email"
                            placeholder="Enter tenant's email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-amber-400"
                        />

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendInvite}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg text-white ${
                                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {loading ? "Sending..." : "Send Invite"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
