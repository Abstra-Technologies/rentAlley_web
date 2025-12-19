"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Home, PlusCircle, Building2 } from "lucide-react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";

interface Props {
    landlordId: number | undefined;
}

export default function LandlordPropertyMarquee({ landlordId }: Props) {
    const router = useRouter();
    const { properties, loading, fetchAllProperties } = usePropertyStore();
    const { subscription, loading: subscriptionLoading } =
        useSubscription(landlordId);

    useEffect(() => {
        if (landlordId) fetchAllProperties(landlordId);
    }, [landlordId, fetchAllProperties]);

    if (loading || subscriptionLoading)
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                ))}
            </div>
        );

    if (!properties || properties.length === 0)
        return (
            <div className="text-center py-8 border border-gray-100 rounded-xl bg-white">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlusCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                    No Properties Yet
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Start by adding your first property to manage your units.
                </p>
                <button
                    onClick={() =>
                        router.push("/pages/landlord/property-listing/create-property")
                    }
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600
          hover:from-blue-700 hover:to-emerald-700
          text-white rounded-lg font-semibold text-sm
          transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    Add Property
                </button>
            </div>
        );

    const limitedProperties = properties.slice(0, 5);

    return (
        <div
            className="bg-white rounded-xl border border-gray-100 p-4
      transition-all duration-300
      hover:shadow-md hover:ring-1 hover:ring-blue-100
      hover:-translate-y-[1px]
      space-y-3 h-[500px] flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full" />
                    <h2 className="text-sm md:text-base font-semibold text-gray-900">
                        Your Properties
                    </h2>
                </div>
                <span className="text-xs text-gray-500">{properties.length} total</span>
            </div>

            {/* MOBILE SLIDER */}
            <div className="md:hidden overflow-x-auto flex gap-3 pb-2 snap-x snap-mandatory scrollbar-hide">
                {limitedProperties.map((property) => (
                    <div
                        key={property.property_id}
                        onClick={() =>
                            router.push(`/pages/landlord/properties/${property.property_id}`)
                        }
                        className="snap-start min-w-[220px]
            bg-gray-50 rounded-lg overflow-hidden
            cursor-pointer flex-shrink-0
            border border-gray-100
            transition-all duration-200
            hover:bg-gray-100 hover:shadow-sm hover:ring-1 hover:ring-blue-100"
                    >
                        <div className="relative w-full h-28 bg-gray-100">
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
                        <div className="p-3">
                            <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                                {property.property_name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                {[property?.street, property?.city, property?.province]
                                    .filter(Boolean)
                                    .join(", ") || "Address not specified"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* DESKTOP LIST */}
            <div className="hidden md:block flex-1 overflow-y-auto divide-y divide-gray-100">
                {limitedProperties.map((property) => (
                    <div
                        key={property.property_id}
                        onClick={() =>
                            router.push(`/pages/landlord/properties/${property.property_id}`)
                        }
                        className="flex items-center gap-3 p-2.5 rounded-lg
            cursor-pointer transition-all duration-200
            hover:bg-gray-50 hover:shadow-sm hover:ring-1 hover:ring-blue-100"
                    >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                            {property.photos?.length > 0 ? (
                                <Image
                                    src={property.photos[0].photo_url}
                                    alt={property.property_name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Building2 className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {property.property_name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                {[property?.street, property?.city, property?.province]
                                    .filter(Boolean)
                                    .join(", ") || "Address not specified"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All */}
            {properties.length > 5 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/pages/landlord/property-listing`);
                    }}
                    className="w-full text-center text-sm font-medium
          text-blue-600 hover:text-blue-700
          py-2 transition-colors"
                >
                    View All Properties ({properties.length}) →
                </button>
            )}
        </div>
    );
}
