"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Home } from "lucide-react";
import usePropertyStore from "@/zustand/property/usePropertyStore";

interface Props {
    landlordId: number | undefined;
}

export default function LandlordPropertyMarqueeMobile({ landlordId }: Props) {
    const router = useRouter();
    const { properties, loading, fetchAllProperties } = usePropertyStore();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (landlordId) fetchAllProperties(landlordId);
    }, [landlordId, fetchAllProperties]);

    if (loading) {
        return (
            <div className="mx-4 h-48 bg-gray-200 rounded-xl animate-pulse" />
        );
    }

    if (!properties || properties.length === 0) return null;

    const property = properties[index];

    const swipeConfidenceThreshold = 100;

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x < -swipeConfidenceThreshold && index < properties.length - 1) {
            setIndex((prev) => prev + 1);
        } else if (info.offset.x > swipeConfidenceThreshold && index > 0) {
            setIndex((prev) => prev - 1);
        }
    };

    return (
        <div className="block md:hidden w-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={property.property_id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="w-full cursor-grab active:cursor-grabbing"
                >
                    {/* CARD */}
                    <div
                        onClick={() =>
                            router.push(`/pages/landlord/properties/${property.property_id}`)
                        }
                        className="
    mx-auto
    w-full max-w-[360px]
    rounded-2xl overflow-hidden
    bg-white border border-gray-100
    shadow-md
  "
                    >
                        {/* IMAGE — FIXED ASPECT RATIO */}
                        <div className="relative w-full aspect-[4/3] bg-gray-200">
                            {property.photos?.[0]?.photo_url ? (
                                <Image
                                    src={property.photos[0].photo_url}
                                    alt={property.property_name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 360px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Home className="w-10 h-10" />
                                </div>
                            )}
                        </div>

                        {/* CONTENT */}
                        <div className="p-4">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                                {property.property_name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1 truncate mt-1">
                                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                                {[property.street, property.city, property.province]
                                    .filter(Boolean)
                                    .join(", ") || "Address not specified"}
                            </p>

                            <div className="mt-3 text-xs text-gray-400 text-center">
                                {index + 1} / {properties.length}
                            </div>
                        </div>
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
