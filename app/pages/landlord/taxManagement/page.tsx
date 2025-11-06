"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import { BackButton } from "@/components/navigation/backButton";
import useAuthStore from "@/zustand/authStore";
import { Upload } from "lucide-react";
import TaxComputationCard from "@/components/landlord/taxManagement/TaxComputationCard";

export default function LandlordTaxProfilePage() {
    const { user, fetchSession } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [taxProfile, setTaxProfile] = useState<any>({
        tin_number: "",
        registered_name: "",
        bir_branch_code: "",
        tax_type: "percentage",
        filing_type: "monthly",
        bir_certificate_url: "",
    });

    const [birFile, setBirFile] = useState<File | null>(null);

    useEffect(() => {
        if (!user) fetchSession();
        else loadTaxProfile();
    }, [user]);

    const loadTaxProfile = async () => {
        try {
            const res = await axios.get(`/api/landlord/taxProfile?landlord_id=${user?.landlord_id}`);
            if (res.data?.profile) setTaxProfile(res.data.profile);
        } catch (err) {
            console.error("Failed to fetch tax profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setTaxProfile((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!taxProfile.tin_number) {
            Swal.fire("Error", "TIN number is required.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("landlord_id", user?.landlord_id);
        formData.append("tin_number", taxProfile.tin_number);
        formData.append("registered_name", taxProfile.registered_name || "");
        formData.append("bir_branch_code", taxProfile.bir_branch_code || "");
        formData.append("tax_type", taxProfile.tax_type);
        formData.append("filing_type", taxProfile.filing_type);

        if (birFile) formData.append("bir_certificate", birFile);

        setSaving(true);
        try {
            await axios.post("/api/landlord/taxProfile", formData);
            Swal.fire("Success", "Tax profile saved successfully!", "success");
            loadTaxProfile();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to save tax profile.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                        <p className="text-gray-600">Loading tax profile...</p>
                    </div>
                </div>
        );
    }

    return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
                <BackButton label="Back to Dashboard" />

                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 mt-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Tax Information</h1>
                    <p className="text-gray-500 mb-6">
                        Manage your BIR registration details and tax filing preferences.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                TIN Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="tin_number"
                                value={taxProfile.tin_number}
                                onChange={handleChange}
                                placeholder="e.g., 123-456-789-000"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registered Name</label>
                            <input
                                name="registered_name"
                                value={taxProfile.registered_name}
                                onChange={handleChange}
                                placeholder="e.g., Juan Dela Cruz Rentals"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">BIR Branch Code</label>
                            <input
                                name="bir_branch_code"
                                value={taxProfile.bir_branch_code}
                                onChange={handleChange}
                                placeholder="e.g., 039"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                            <select
                                name="tax_type"
                                value={taxProfile.tax_type}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="percentage">Percentage (3%)</option>
                                <option value="vat">VAT (12%)</option>
                                <option value="non-vat">Non-VAT</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filing Type</label>
                            <select
                                name="filing_type"
                                value={taxProfile.filing_type}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                BIR Certificate (optional)
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setBirFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="bir_upload"
                                />
                                <label
                                    htmlFor="bir_upload"
                                    className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer transition"
                                >
                                    <Upload size={16} className="mr-2" />
                                    {birFile ? "File Selected" : "Upload File"}
                                </label>
                                {taxProfile.bir_certificate_url && (
                                    <a
                                        href={taxProfile.bir_certificate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        View Current
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
                            saving
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
                        }`}
                    >
                        {saving ? "Saving..." : "Save Tax Profile"}
                    </button>
                </div>

                <TaxComputationCard
                    landlordId={user?.landlord_id}
                    taxType={taxProfile.tax_type}
                    filingType={taxProfile.filing_type}
                />

            </div>
    );
}
