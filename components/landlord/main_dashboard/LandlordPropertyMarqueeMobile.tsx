"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Home, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import {
  CARD_BASE,
  GRADIENT_DOT,
  GRADIENT_TEXT,
  GRADIENT_PRIMARY,
  SECTION_HEADER,
  SECTION_TITLE,
} from "@/constant/design-constants";

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

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <div className="px-4">
        <div className="h-[420px] bg-gray-100 rounded-2xl animate-pulse shadow-sm border border-gray-200" />
      </div>
    );
  }

  /* ---------------- EMPTY STATE ---------------- */
  if (!properties || properties.length === 0) {
    return (
      <div className="px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            No Properties Yet
          </h3>
          <p className="text-sm text-gray-600">
            Add your first property to get started
          </p>
        </div>
      </div>
    );
  }

  const property = properties[index];
  const swipeConfidenceThreshold = 100;

  const handleDragEnd = (_: any, info: any) => {
    if (
      info.offset.x < -swipeConfidenceThreshold &&
      index < properties.length - 1
    ) {
      setIndex((prev) => prev + 1);
    } else if (info.offset.x > swipeConfidenceThreshold && index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  const goToPrevious = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  const goToNext = () => {
    if (index < properties.length - 1) setIndex((prev) => prev + 1);
  };

  return (
    <div className="block md:hidden w-full">
      {/* Header with Counter */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className={SECTION_HEADER}>
          <span className={GRADIENT_DOT} />
          <h2 className={SECTION_TITLE}>Your Properties</h2>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          <span className={GRADIENT_TEXT}>{index + 1}</span>
          <span>/</span>
          <span>{properties.length}</span>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={property.property_id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.96, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            {/* Property Card */}
            <div
              className={`${CARD_BASE} overflow-hidden
                                shadow-lg hover:shadow-xl
                                transition-all duration-300
                                active:scale-[0.98]`}
            >
              {/* Image Section with Gradient Overlay */}
              <div
                onClick={() =>
                  router.push(
                    `/pages/landlord/properties/${property.property_id}`,
                  )
                }
                className="relative w-full aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer group"
              >
                {property.photos?.[0]?.photo_url ? (
                  <>
                    <Image
                      src={property.photos[0].photo_url}
                      alt={property.property_name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw"
                      priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

                    {/* View Details Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-gray-900">
                        View Details
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Home className="w-12 h-12 mb-2" />
                    <span className="text-xs font-medium">No image</span>
                  </div>
                )}

                {/* Property Count Badge */}
                {properties.length > 1 && (
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-xs font-bold text-white">
                      {index + 1} / {properties.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-5 space-y-3">
                {/* Property Name */}
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                  {property.property_name}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {[property.street, property.city, property.province]
                      .filter(Boolean)
                      .join(", ") || "Address not specified"}
                  </p>
                </div>

                {/* View Property Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/pages/landlord/properties/${property.property_id}`,
                    );
                  }}
                  className={`w-full ${GRADIENT_PRIMARY} text-white
                                        py-3 rounded-xl font-semibold text-sm
                                        shadow-md hover:shadow-lg
                                        active:scale-95
                                        transition-all duration-300
                                        flex items-center justify-center gap-2`}
                >
                  <Eye className="w-4 h-4" />
                  View Property Details
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (Only show if multiple properties) */}
        {properties.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={goToPrevious}
              disabled={index === 0}
              className={`absolute left-6 top-1/2 -translate-y-1/2 z-10
                                w-10 h-10 rounded-full
                                bg-white shadow-lg border border-gray-200
                                flex items-center justify-center
                                transition-all duration-300
                                ${
                                  index === 0
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:scale-110 hover:shadow-xl active:scale-95"
                                }`}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              disabled={index === properties.length - 1}
              className={`absolute right-6 top-1/2 -translate-y-1/2 z-10
                                w-10 h-10 rounded-full
                                bg-white shadow-lg border border-gray-200
                                flex items-center justify-center
                                transition-all duration-300
                                ${
                                  index === properties.length - 1
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:scale-110 hover:shadow-xl active:scale-95"
                                }`}
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {properties.length > 1 && properties.length <= 5 && (
        <div className="flex items-center justify-center gap-2 mt-4 px-4">
          {properties.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === index
                  ? "w-8 bg-gradient-to-r from-blue-600 to-emerald-600"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}

      {/* Swipe Hint (Only show on first property) */}
      {properties.length > 1 && index === 0 && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="text-center mt-3 px-4"
        >
          <p className="text-xs text-gray-400 font-medium">
            ← Swipe to browse properties →
          </p>
        </motion.div>
      )}
    </div>
  );
}
