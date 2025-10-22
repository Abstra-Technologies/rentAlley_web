"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Home } from "lucide-react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";

interface Props {
    landlordId: number | undefined;
}

export default function LandlordPropertyMarquee({ landlordId }: Props) {
    const router = useRouter();
    const { properties, loading, fetchAllProperties } = usePropertyStore();
    const { subscription, loading: subscriptionLoading } = useSubscription(landlordId);

    useEffect(() => {
        if (landlordId) fetchAllProperties(landlordId);
    }, [landlordId, fetchAllProperties]);

    if (loading || subscriptionLoading) {
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

    // ✅ Apply subscription limit
    const propertyLimit = subscription?.listingLimits?.maxProperties || 3;
    const limitedProperties = properties.slice(0, propertyLimit);

    // ✅ Determine if marquee should move
    const enableMarquee = limitedProperties.length >= 5;

    console.log("property limit", propertyLimit, "marquee:", enableMarquee);

    return (
        <div className="relative overflow-hidden w-full py-3 group">
            <div
                className={`marquee-wrapper flex gap-4 ${
                    enableMarquee ? "animate-marquee" : ""
                } hover:[animation-play-state:paused]`}
            >
                {[...limitedProperties, ...(enableMarquee ? limitedProperties : [])].map(
                    (property, index) => (
                        <div
                            key={`${property.property_id}-${index}`}
                            onClick={() =>
                                router.push(
                                    `/pages/landlord/property-listing/view-unit/${property.property_id}`
                                )
                            }
                            className="relative min-w-[260px] sm:min-w-[280px] bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-lg cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group/property"
                        >
                            {/* Property Photo */}
                            <div className="relative w-full h-32 sm:h-36 bg-gray-100">
                                {property.photos?.length > 0 && property.photos[0]?.photo_url ? (
                                    <Image
                                        src={property.photos[0].photo_url}
                                        alt={property.property_name || "Property Image"}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover/property:scale-110"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <Home className="w-8 h-8" />
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/property:opacity-100 transition-all duration-300">
                  <span className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-full shadow-lg">
                    View Property
                  </span>
                                </div>
                            </div>

                            {/* Property Info */}
                            <div className="p-3">
                                <h3 className="text-sm font-semibold text-gray-800 truncate">
                                    {property.property_name}
                                </h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                    <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                    {[
                                        property?.street,
                                        property?.city,
                                        property?.province
                                            ?.split("_")
                                            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                            .join(" "),
                                    ]
                                        .filter(Boolean)
                                        .join(", ") || "Address not specified"}
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>

            <style jsx>{`
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                .animate-marquee {
                    animation: scroll 45s linear infinite;
                }

                .group:hover .animate-marquee {
                    animation-play-state: paused;
                }

                @media (max-width: 768px) {
                    .animate-marquee {
                        animation-duration: 30s;
                    }
                }
            `}</style>
        </div>
    );
}
