"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Mail,
    UserPlus,
    Home,
    Building2,
    Send,
    Calendar,
    FileText,
    Banknote,
} from "lucide-react";
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
    const [securityDeposit, setSecurityDeposit] = useState("");
    const [advancePayment, setAdvancePayment] = useState("");
    const [leaseFile, setLeaseFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);

    const landlordId = user?.landlord_id;

    // 🧩 Fetch landlord properties
    useEffect(() => {
        const fetchProperties = async () => {
            if (!landlordId) {
                await fetchSession();
                return;
            }
            try {
                const response = await axios.get(
                    `/api/landlord/properties/getProperties?landlord_id=${landlordId}`
                );
                setProperties(response.data.data || []);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, [landlordId, fetchSession]);

    // 🏠 Fetch units for selected property
    useEffect(() => {
        const fetchUnits = async () => {
            if (!selectedProperty) return;
            try {
                const res = await axios.get(
                    `/api/unitListing/getUnitListings?property_id=${selectedProperty}`
                );
                setUnits(res.data || []);
            } catch (error) {
                console.error("Error fetching units:", error);
            }
        };
        fetchUnits();
    }, [selectedProperty]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setLeaseFile(file || null);
    };

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

        const formData = new FormData();
        formData.append("landlord_id", landlordId);
        formData.append("property_id", selectedProperty);
        formData.append("unit_id", selectedUnit);
        formData.append("email", tenantEmail);
        formData.append("lease_start", leaseStart);
        formData.append("lease_end", leaseEnd);
        if (securityDeposit) formData.append("security_deposit", securityDeposit);
        if (advancePayment) formData.append("advance_payment", advancePayment);
        if (leaseFile) formData.append("lease_file", leaseFile);

        try {
            Swal.fire({
                title: "Sending Invite...",
                text: "Please wait while we send the tenant invitation.",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post("/api/landlord/inviteTenant", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.close();
            if (res.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Invitation Sent!",
                    text: `An invite has been sent to ${tenantEmail}.`,
                    confirmButtonColor: "#10b981",
                });
                setTenantEmail("");
                setSelectedProperty("");
                setSelectedUnit("");
                setLeaseStart("");
                setLeaseEnd("");
                setSecurityDeposit("");
                setAdvancePayment("");
                setLeaseFile(null);
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
        <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 relative">
                <BackButton label="Back to Tenants" />

                {/* Header */}
                <div className="text-center mb-8 mt-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Invite a Tenant</h1>
                    <p className="text-gray-600 mt-2 text-sm">
                        Send an invitation link to your tenant with lease details.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-5">
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
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Property Select */}
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
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm appearance-none"
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

                    {/* Unit Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Unit <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Home className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <select
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm appearance-none"
                                disabled={!selectedProperty}
                            >
                                <option value="">Choose a unit...</option>
                                {units.length > 0 ? (
                                    units.map((u) => (
                                        <option key={u.unit_id} value={u.unit_id}>
                                            {u.unit_name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No units available</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Lease Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security & Advance (optional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Security Deposit (optional)
                            </label>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={securityDeposit}
                                    onChange={(e) => setSecurityDeposit(e.target.value)}
                                    placeholder="₱0.00"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Advance Payment (optional)
                            </label>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={advancePayment}
                                    onChange={(e) => setAdvancePayment(e.target.value)}
                                    placeholder="₱0.00"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Upload Lease (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Lease Agreement (optional)
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={handleFileChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleSendInvite}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                        >
                            <Send className="w-4 h-4" />
                            Send Invitation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
