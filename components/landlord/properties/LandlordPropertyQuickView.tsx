"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Home } from "lucide-react";
import usePropertyStore from "@/zustand/property/usePropertyStore";

interface Props {
    landlordId: number | undefined;
}

export default function LandlordPropertyMarquee({ landlordId }: Props) {
    const router = useRouter();
    const { properties, loading, fetchAllProperties } = usePropertyStore();

    useEffect(() => {
        if (landlordId) fetchAllProperties(landlordId);
    }, [landlordId, fetchAllProperties]);

    if (loading) {
        return (
            <div className="w-full text-center text-gray-500 py-6 animate-pulse">
                Loading properties...
            </div>
        );
    }

    if (!properties || properties.length === 0) {
        return (
            <div className="w-full text-center text-gray-500 py-6">
                No properties yet. Add your first property to get started.
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden w-full py-3 group">
            {/* This wrapper allows circular, seamless looping */}
            <div className="marquee-wrapper flex gap-4 hover:[animation-play-state:paused]">
                {[...properties, ...properties].map((property, index) => (
                    <div
                        key={`${property.property_id}-${index}`}
                        onClick={() =>
                            router.push(`/pages/landlord/property/${property.property_id}`)
                        }
                        className="min-w-[260px] sm:min-w-[280px] bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-lg cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                    >
                        {/* Property Photo */}
                        <div className="relative w-full h-32 sm:h-36 bg-gray-100">
                            {property.photos?.length > 0 && property.photos[0]?.photo_url ? (
                                <Image
                                    src={property.photos[0].photo_url}
                                    alt={property.property_name || "Property Image"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <Home className="w-8 h-8" />
                                </div>
                            )}
                        </div>

                        {/* Property Info */}
                        <div className="p-3">
                            <h3 className="text-sm font-semibold text-gray-800 truncate">
                                {property.property_name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                {property.address || "No address"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Marquee keyframes & styles */}
            <style jsx>{`
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                .marquee-wrapper {
                    display: flex;
                    width: max-content;
                    animation: scroll 45s linear infinite;
                }

                /* Pause animation when hovering any card */
                .group:hover .marquee-wrapper {
                    animation-play-state: paused;
                }

                /* Faster on smaller screens for balance */
                @media (max-width: 768px) {
                    .marquee-wrapper {
                        animation-duration: 30s;
                    }
                }
            `}</style>
        </div>
    );
}
