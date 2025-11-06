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

    const propertyLimit = subscription?.listingLimits?.maxProperties || 5;
    const limitedProperties = properties.slice(0, propertyLimit);
    const enableMarquee = limitedProperties.length >= 4;

    return (
        <div className="relative w-full overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-gradient-to-r from-white via-gray-50 to-white">
            {/* Scroll wrapper with safe height */}
            <div className="overflow-x-hidden overflow-y-hidden py-4 max-h-[220px] sm:max-h-[250px]">
                <div
                    className={`flex gap-4 sm:gap-6 ${
                        enableMarquee ? "animate-marquee" : "justify-start flex-wrap"
                    } hover:[animation-play-state:paused]`}
                >
                    {[...limitedProperties, ...(enableMarquee ? limitedProperties : [])].map(
                        (property, index) => (
                            <div
                                key={`${property.property_id}-${index}`}
                                onClick={() =>
                                    router.push(`/pages/landlord/properties/${property.property_id}`)
                                }
                                className="relative min-w-[220px] sm:min-w-[260px] bg-white border border-gray-100 rounded-xl shadow-md hover:shadow-lg cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] group/property"
                            >
                                {/* Image */}
                                <div className="relative w-full h-28 sm:h-32 bg-gray-100">
                                    {property.photos?.length > 0 && property.photos[0]?.photo_url ? (
                                        <Image
                                            src={property.photos[0].photo_url}
                                            alt={property.property_name || "Property Image"}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover/property:scale-110"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <Home className="w-7 h-7" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/property:opacity-100 transition-all duration-300">
                    <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      View Property
                    </span>
                                    </div>
                                </div>

                                <div className="p-2.5">
                                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                                        {property.property_name}
                                    </h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
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
            </div>

            {/* Edge fades */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 via-white/80 to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 via-white/80 to-transparent z-10" />

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
          animation: scroll 50s linear infinite;
          will-change: transform;
          width: max-content;
          display: inline-flex;
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
