"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Home, PlusCircle } from "lucide-react";
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

    if (loading || subscriptionLoading) return (
        <div className="w-full text-center text-gray-500 py-2 animate-pulse">
            Loading properties...
        </div>
    );

    if (!properties || properties.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow p-6 border border-gray-200 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                <PlusCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Properties Yet</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
                Start by adding your first property to manage your units.
            </p>
            <button
                onClick={() => router.push("/pages/landlord/property-listing/create-property")}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
                Add Property
            </button>

            {/* Overlay button for "View All Properties" */}
            <div
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition pointer-events-none"
            >
        <span
            onClick={() => router.push(`/pages/landlord/properties`)}
            className="pointer-events-auto bg-white/90 shadow px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
        >
          View All Properties →
        </span>
            </div>
        </div>
    );

    const limitedProperties = properties.slice(0, 5);

    return (
        <div className="w-full p-2 bg-white rounded-lg border border-gray-200 shadow-sm relative group">
            <h2 className="text-md font-semibold text-gray-800 mb-2">Your Properties</h2>

            {/* MOBILE IMAGE SLIDER */}
            <div className="sm:hidden overflow-x-auto flex space-x-2 pb-1 snap-x snap-mandatory scrollbar-none">
                {limitedProperties.map((property) => (
                    <div
                        key={property.property_id}
                        onClick={() =>
                            router.push(`/pages/landlord/properties/${property.property_id}`)
                        }
                        className="snap-start min-w-[240px] bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all flex-shrink-0 relative"
                    >
                        <div className="relative w-full h-40 bg-gray-100">
                            {property.photos?.[0]?.photo_url ? (
                                <Image
                                    src={property.photos[0].photo_url}
                                    alt={property.property_name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Home className="w-10 h-10" />
                                </div>
                            )}
                        </div>
                        <div className="p-2">
                            <h3 className="font-semibold text-[14px] text-gray-800 truncate">
                                {property.property_name}
                            </h3>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                {[
                                    property?.street,
                                    property?.city,
                                    property?.province
                                        ?.split("_")
                                        .map((w: string) => w[0].toUpperCase() + w.slice(1))
                                        .join(" "),
                                ]
                                    .filter(Boolean)
                                    .join(", ") || "Address not specified"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* DESKTOP STACKED LIST */}
            <div className="hidden sm:block space-y-2">
                {limitedProperties.map((property) => (
                    <div
                        key={property.property_id}
                        onClick={() =>
                            router.push(`/pages/landlord/properties/${property.property_id}`)
                        }
                        className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 cursor-pointer transition-all relative"
                    >
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
                                        .join(" "),
                                ]
                                    .filter(Boolean)
                                    .join(", ") || "Address not specified"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Overlay for "View All Properties" */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <span
            onClick={() => router.push(`/pages/landlord/properties`)}
            className="pointer-events-auto bg-white/90 shadow px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
        >
          View All Properties →
        </span>
            </div>
        </div>
    );
}
