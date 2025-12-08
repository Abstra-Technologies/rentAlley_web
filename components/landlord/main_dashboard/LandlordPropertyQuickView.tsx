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
            <div className="w-full text-center text-gray-500 py-4 animate-pulse">
                Loading properties...
            </div>
        );
    }

    if (!properties || properties.length === 0) {
        return (
            <div className="w-full text-center text-gray-500 py-4">
                No properties yet. Add your first property to get started.
            </div>
        );
    }

    // Always limit to 5
    const limitedProperties = properties.slice(0, 5);

    return (
        <div className="w-full p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-md font-semibold text-gray-800 mb-2">
                Your Properties
            </h2>

            {/* SLIM STACKED LIST */}
            <div className="space-y-2">
                {limitedProperties.map((property) => (
                    <div
                        key={property.property_id}
                        onClick={() =>
                            router.push(`/pages/landlord/properties/${property.property_id}`)
                        }
                        className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 cursor-pointer transition-all"
                    >
                        {/* Slim Image */}
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {property.photos?.length > 0 ? (
                                <Image
                                    src={property.photos[0].photo_url}
                                    alt={property.property_name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Home className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {/* Slim Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-semibold text-gray-800 truncate leading-tight">
                                {property.property_name}
                            </h3>

                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate leading-tight">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                {[
                                    property?.street,
                                    property?.city,
                                    property?.province
                                        ?.split("_")
                                        .map((w: string) => w[0].toUpperCase() + w.slice(1))
                                        .join(" ")
                                ]
                                    .filter(Boolean)
                                    .join(", ") || "Address not specified"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
