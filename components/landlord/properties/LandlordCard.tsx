
"use client";

import { useEffect, useState } from "react";
import { FaUserTie, FaPhoneAlt, FaEnvelope, FaBuilding } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface Landlord {
    landlord_id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    photoUrl?: string;
}

export default function LandlordCard({ landlord_id }: { landlord_id: number }) {
    const [landlord, setLandlord] = useState<Landlord | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!landlord_id) return;

        const fetchLandlord = async () => {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}`);
                if (!res.ok) throw new Error("Failed to fetch landlord details");
                const data = await res.json();
                setLandlord(data);
            } catch (error) {
                console.error("Error fetching landlord:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLandlord();
    }, [landlord_id]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <p className="text-gray-500">Loading landlord details...</p>
            </div>
        );
    }

    const handleClick = () => {
        router.push(`/pages/public/${landlord?.landlord_id}`);
    };

    if (!landlord) return null;

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 relative">
            {/* Header */}
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                <FaUserTie className="mr-2 text-purple-500" />
                About the Landlord
            </h2>

            <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition"
                onClick={handleClick}
            >
                <div className="flex items-center">
                    {landlord.photoUrl ? (
                        <img
                            src={landlord.photoUrl}
                            alt={landlord.name}
                            className="w-16 h-16 rounded-full mr-4 object-cover shadow-sm"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full mr-4 bg-purple-100 flex items-center justify-center text-purple-600 font-bold shadow-sm">
                            {landlord.name?.charAt(0) || "L"}
                        </div>
                    )}
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{landlord.name}</p>
                        {landlord.company && (
                            <p className="text-sm text-gray-500 flex items-center">
                                <FaBuilding className="mr-1 text-gray-400" />
                                {landlord.company}
                            </p>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-2 text-sm">
                    {landlord.phone && (
                        <div className="flex items-center text-gray-700">
                            <FaPhoneAlt className="mr-2 text-green-500" />
                            <a href={`tel:${landlord.phone}`} className="hover:underline break-all">
                                {landlord.phone}
                            </a>
                        </div>
                    )}
                    {landlord.email && (
                        <div className="flex items-center text-gray-700">
                            <FaEnvelope className="mr-2 text-blue-500" />
                            <a href={`mailto:${landlord.email}`} className="hover:underline break-all">
                                {landlord.email}
                            </a>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

