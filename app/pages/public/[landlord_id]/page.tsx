
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaUserTie, FaEnvelope, FaPhoneAlt, FaBuilding } from "react-icons/fa";
import { BackButton } from "@/components/navigation/backButton";

interface Landlord {
    landlord_id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    photoUrl?: string;
}

export default function LandlordDetailsPage() {
    const { landlord_id } = useParams();
    const [landlord, setLandlord] = useState<Landlord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;

        const fetchLandlord = async () => {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}`);
                if (!res.ok) throw new Error("Failed to fetch landlord details");
                const data = await res.json();
                setLandlord(data);
            } catch (err) {
                console.error("Error fetching landlord:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLandlord();
    }, [landlord_id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading landlord details...</p>
            </div>
        );
    }

    if (!landlord) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500">Landlord not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <BackButton label='Back to Property Details'/>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-500 p-6 flex flex-col items-center text-white">
                    {landlord.photoUrl ? (
                        <img
                            src={landlord.photoUrl}
                            alt={landlord.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-2xl border-4 border-white shadow-md">
                            {landlord.name?.charAt(0) || "L"}
                        </div>
                    )}

                    <h1 className="mt-4 text-2xl font-bold">{landlord.name}</h1>
                    {landlord.company && (
                        <p className="text-sm text-purple-100 flex items-center mt-1">
                            <FaBuilding className="mr-1" /> {landlord.company}
                        </p>
                    )}
                </div>

                {/* Body Info */}
                <div className="p-6 space-y-4">
                    {landlord.phone && (
                        <div className="flex items-center text-gray-700">
                            <FaPhoneAlt className="mr-2 text-green-500" />
                            <a
                                href={`tel:${landlord.phone}`}
                                className="hover:underline break-all"
                            >
                                {landlord.phone}
                            </a>
                        </div>
                    )}

                    {landlord.email && (
                        <div className="flex items-center text-gray-700">
                            <FaEnvelope className="mr-2 text-blue-500" />
                            <a
                                href={`mailto:${landlord.email}`}
                                className="hover:underline break-all"
                            >
                                {landlord.email}
                            </a>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 border-t border-gray-200">
                    {/* Total Properties */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-4 text-center shadow-md text-white">
                        <p className="text-2xl font-bold">{landlord.totalProperties ?? 0}</p>
                        <p className="text-xs uppercase tracking-wide">Properties</p>
                    </div>

                    {/* Satisfaction Score */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-center shadow-md text-white">
                        <p className="text-2xl font-bold">
                            {landlord.satisfactionScore ?? "N/A"}
                        </p>
                        <p className="text-xs uppercase tracking-wide">Satisfaction</p>
                    </div>
                </div>


            </div>
        </div>
    );

}
