"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus, Building2, Send, Calendar, Home } from "lucide-react";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";
import { BackButton } from "@/components/navigation/backButton";

export default function InviteTenantPage() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();

    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const [tenantEmail, setTenantEmail] = useState("");
    const [leaseStart, setLeaseStart] = useState("");
    const [leaseEnd, setLeaseEnd] = useState("");
    const [loading, setLoading] = useState(true);

    const landlordId = user?.landlord_id;

    // 🧩 Fetch Properties
    useEffect(() => {
        const fetchProperties = async () => {
            if (!landlordId) {
                await fetchSession();
                return;
            }
            try {
                const response = await axios.get(`/api/landlord/${landlordId}/properties`);
                setProperties(response.data.data || []);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, [landlordId, fetchSession]);

    // 🧩 Fetch Units when property changes
    useEffect(() => {
        const fetchUnits = async () => {
            if (!selectedProperty) {
                setUnits([]);
                setSelectedUnit("");
                return;
            }
            try {
                // adjust endpoint as needed — this matches earlier examples
                const res = await axios.get(`/api/unitListing/getUnitListings?property_id=${selectedProperty}`);
                setUnits(res.data || []);
            } catch (error) {
                console.error("Error fetching units:", error);
                setUnits([]);
            }
        };
        fetchUnits();
    }, [selectedProperty]);

    const handleSendInvite = async () => {
        if (!tenantEmail || !selectedProperty || !selectedUnit || !leaseStart || !leaseEnd) {
            Swal.fire({
                icon: "warning",
                title: "Missing Required Fields",
                text: "Please fill out all required fields before sending an invite.",
                confirmButtonColor: "#2563eb",
            });
            return;
        }

        // Find selected property + unit names
        const property = properties.find((p) => p.property_id === selectedProperty);
        const unit = units.find((u) => u.unit_id === selectedUnit);

        const propertyName = property?.property_name || "Unknown Property";
        const unitName = unit?.unit_name || unit?.unit_name || "Unknown Unit";

        try {
            Swal.fire({
                title: "Sending Invite...",
                text: "Please wait while we send the tenant invitation.",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                email: tenantEmail,
                unitId: selectedUnit,
                propertyName,
                unitName,
                startDate: leaseStart,
                endDate: leaseEnd,
            };

            const res = await axios.post("/api/invite", payload, {
                headers: { "Content-Type": "application/json" },
            });

            Swal.close();

            if (res.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Invitation Sent!",
                    text: `An invite has been sent to ${tenantEmail}.`,
                    confirmButtonColor: "#10b981",
                });

                // Reset form
                setTenantEmail("");
                setSelectedProperty("");
                setSelectedUnit("");
                setLeaseStart("");
                setLeaseEnd("");
                setUnits([]);
            } else {
                throw new Error(res.data.message || "Failed to send invite.");
            }
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Failed to Send Invite",
                text: error.message || "Something went wrong.",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    if (loading)
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
                <LoadingScreen message="Loading properties..." />
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 lg:p-10 relative">
                    <div className="mb-6">
                        <BackButton label="Back to Tenants" />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-10 mt-2">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <UserPlus className="w-10 h-10 text-blue-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Invite a Tenant
                        </h1>
                        <p className="text-gray-600 mt-2 text-sm sm:text-base">
                            Send an invitation link to your tenant with lease details.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-8">
                        {/* Tenant Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tenant Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={tenantEmail}
                                    onChange={(e) => setTenantEmail(e.target.value)}
                                    placeholder="tenant@example.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Property */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Property <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <select
                                    value={selectedProperty}
                                    onChange={(e) => {
                                        setSelectedProperty(e.target.value);
                                        setSelectedUnit("");
                                    }}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base appearance-none"
                                >
                                    <option value="">Choose a property...</option>
                                    {properties.length > 0 ? (
                                        properties.map((p) => (
                                            <option key={p.property_id} value={p.property_id}>
                                                {p.property_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No properties found</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Unit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Unit <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Home className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base appearance-none"
                                    disabled={!selectedProperty || units.length === 0}
                                >
                                    <option value="">Choose a unit...</option>
                                    {units.length > 0 ? (
                                        units.map((u: any) => (
                                            <option key={u.unit_id} value={u.unit_id}>
                                                {u.unit_name} — {u.status}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No units available</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Lease Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lease Start Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        value={leaseStart}
                                        onChange={(e) => setLeaseStart(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lease End Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        value={leaseEnd}
                                        onChange={(e) => setLeaseEnd(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6 flex justify-end">
                            <button
                                onClick={handleSendInvite}
                                className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold text-white text-sm sm:text-base bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                            >
                                <Send className="w-5 h-5" />
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
