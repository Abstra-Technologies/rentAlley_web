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
  const enableMarquee = limitedProperties.length >= 5;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">

      {/* 📱 MOBILE LIST MODE */}
      <div className="sm:hidden p-2 space-y-3">
        {limitedProperties.map((property) => (
          <div
            key={property.property_id}
            onClick={() =>
              router.push(`/pages/landlord/properties/${property.property_id}`)
            }
            className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition"
          >
            {/* Image */}
            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100">
              {property.photos?.length > 0 ? (
                <Image
                  src={property.photos[0].photo_url}
                  alt={property.property_name || "Property Image"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Home className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-gray-800 leading-tight">
                {property.property_name}
              </h3>
              <p className="text-[12px] text-gray-500 flex items-center gap-1 mt-1 leading-tight">
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

      {/* 🖥 DESKTOP CARD MARQUEE */}
      <div className="hidden sm:block overflow-x-hidden py-4 max-h-[250px]">
        <div
          className={`flex gap-6 ${
            enableMarquee ? "animate-marquee" : "justify-center flex-wrap"
          } hover:[animation-play-state:paused]`}
        >
          {[...limitedProperties, ...(enableMarquee ? limitedProperties : [])].map(
            (property, index) => (
              <div
                key={`${property.property_id}-${index}`}
                onClick={() =>
                  router.push(`/pages/landlord/properties/${property.property_id}`)
                }
                className="relative min-w-[240px] bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group"
              >
                {/* Image */}
                <div className="relative w-full h-32 bg-gray-100">
                  {property.photos?.length > 0 ? (
                    <Image
                      src={property.photos[0].photo_url}
                      alt={property.property_name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Home className="w-7 h-7" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      View Property
                    </span>
                  </div>
                </div>

                {/* Text */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">
                    {property.property_name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
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
            )
          )}
        </div>
      </div>

      {/* Desktop only: fade edges */}
      {enableMarquee && (
        <div className="hidden sm:block">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/90 via-white/50 to-transparent z-10"></div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 via-white/50 to-transparent z-10"></div>
        </div>
      )}

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
      `}</style>
    </div>
  );
}
