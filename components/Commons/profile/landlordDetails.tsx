

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface LandlordDetailsProps {
    landlord_id: string;
    editing?: boolean;
}

export default function LandlordDetails({ landlord_id, editing = false }: LandlordDetailsProps) {
    const [landlordData, setLandlordData] = useState<any>(null);
    const [formData, setFormData] = useState({
        address: "",
        citizenship: "",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;

        axios
            .get(`/api/landlord/${landlord_id}`)
            .then((res) => {
                setLandlordData(res.data);
                setFormData({
                    address: res.data.address || "",
                    citizenship: res.data.citizenship || "",
                });
            })
            .catch((err) => console.error("Failed to fetch landlord details:", err))
            .finally(() => setLoading(false));
    }, [landlord_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return <p className="text-gray-500">Loading landlord details...</p>;
    }

    if (!landlordData) {
        return <p className="text-red-500">No landlord details found.</p>;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            {/* Address */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Address</label>
                {editing ? (
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        rows={2}
                        placeholder="Enter your address"
                    />
                ) : (
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                        {landlordData.address}
                    </div>
                )}
            </div>

            {/* Citizenship */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Citizenship</label>
                {editing ? (
                    <input
                        type="text"
                        name="citizenship"
                        value={formData.citizenship}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="Enter your citizenship"
                    />
                ) : (
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                        {landlordData.citizenship || "Not provided"}
                    </div>
                )}
            </div>

            {/* Verification Status */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Verification Status</label>
                {landlordData.is_verified ? (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Verified
                    </div>
                ) : (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-4 h-4 mr-1.5" />
                        Not Verified
                    </div>
                )}
            </div>


        </div>
    );
}
