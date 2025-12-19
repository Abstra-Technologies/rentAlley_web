"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import axios from "axios";
import { MapPin, Home, PlusCircle, Building2 } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Property {
    property_id: number;
    property_name: string;
    street?: string;
    city?: string;
    province?: string;
    photos?: { photo_url: string }[];
}

interface Props {
    landlordId: string; // Required string – passed from parent
}

export default function LandlordPropertyMarquee({ landlordId }: Props) {
    const router = useRouter();

    const {
        data: properties = [],
        isLoading,
    } = useSWR<Property[]>(
        `/api/landlord/properties/all?landlord_id=${landlordId}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 120_000, // Cache for 2 minutes
            fallbackData: [],
        }
    );

    // Loading state
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    // Empty state
    if (properties.length === 0) {
        return (
            <EmptyState
                onAddProperty={() => router.push("/pages/landlord/property-listing/create-property")}
            />
        );
    }

    const displayedProperties = properties.slice(0, 5);
    const hasMore = properties.length > 5;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-[2px] h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full animate-pulse" />
                    <h2 className="text-base font-bold text-gray-900">Your Properties</h2>
                </div>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {properties.length} total
        </span>
            </div>

            {/* Mobile Horizontal Scroll */}
            <div className="md:hidden flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
                {displayedProperties.map((property) => (
                    <MobilePropertyCard key={property.property_id} property={property} />
                ))}
            </div>

            {/* Desktop Vertical List */}
            <div className="hidden md:flex flex-col flex-1 overflow-y-auto divide-y divide-gray-100">
                {displayedProperties.map((property) => (
                    <DesktopPropertyItem key={property.property_id} property={property} />
                ))}
            </div>

            {/* View All Button */}
            {hasMore && (
                <button
                    onClick={() => router.push("/pages/landlord/property-listing")}
                    className="mt-auto pt-4 text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                    View All Properties ({properties.length}) →
                </button>
            )}
        </div>
    );
}

/* ====================== Sub-components ====================== */

function LoadingSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
            <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-5 bg-gray-100 rounded-full w-20 animate-pulse" />
            </div>
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ onAddProperty }: { onAddProperty: () => void }) {
    return (
        <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <PlusCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">No Properties Yet</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
                Add your first property to start managing units, tenants, and payments.
            </p>
            <button
                onClick={onAddProperty}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
                + Add Your First Property
            </button>
        </div>
    );
}

function MobilePropertyCard({ property }: { property: Property }) {
    const address =
        [property.street, property.city, property.province]
            .filter(Boolean)
            .join(", ") || "Address not set";

    return (
        <div
            onClick={() => window.location.href = `/pages/landlord/properties/${property.property_id}`}
            className="snap-start min-w-[240px] bg-gray-50 rounded-xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300"
        >
            <div className="relative h-36 bg-gray-100">
                {property.photos?.[0]?.photo_url ? (
                    <Image
                        src={property.photos[0].photo_url}
                        alt={property.property_name}
                        fill
                        sizes="240px"
                        className="object-cover"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+HBdgAJAUPB9e9l5wAAAABJRU5ErkJggg=="
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                        <Home className="w-12 h-12 text-gray-400" />
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate">{property.property_name}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {address}
                </p>
            </div>
        </div>
    );
}

function DesktopPropertyItem({ property }: { property: Property }) {
    const address =
        [property.street, property.city, property.province]
            .filter(Boolean)
            .join(", ") || "Address not set";

    return (
        <div
            onClick={() => window.location.href = `/pages/landlord/properties/${property.property_id}`}
            className="flex items-center gap-4 py-3 px-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-sm group"
        >
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                {property.photos?.[0]?.photo_url ? (
                    <Image
                        src={property.photos[0].photo_url}
                        alt={property.property_name}
                        fill
                        sizes="56px"
                        className="object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+HBdgAJAUPB9e9l5wAAAABJRU5ErkJggg=="
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                        <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                    {property.property_name}
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    {address}
                </p>
            </div>
        </div>
    );
}