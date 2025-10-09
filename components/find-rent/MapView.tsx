"use client";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaBuilding,
  FaExpandAlt,
  FaCompress,
  FaFilter,
  FaHome,
} from "react-icons/fa";
import { BsImageAlt, BsZoomIn, BsZoomOut } from "react-icons/bs";
import { HiLocationMarker, HiSparkles } from "react-icons/hi";

import "leaflet/dist/leaflet.css";
import type { Unit } from "../../types/types";

interface MapViewProps {
  filteredUnits: Unit[];
  onUnitClick: (unitId: string, propertyId: string) => void;
}

// Dynamic imports
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-500 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-emerald-400 mx-auto opacity-20"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading map...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    ),
  }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
};

function MapBoundsUpdater({ units }: { units: Unit[] }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        setL(leaflet.default || leaflet);
      });
    }
  }, []);

  let map;
  try {
    const { useMap } = require("react-leaflet");
    map = useMap();
  } catch (e) {
    return null;
  }

  useEffect(() => {
    if (!L || !map || !units || units.length === 0) return;

    try {
      const validCoords: [number, number][] = units
        .filter((unit) => unit.latitude && unit.longitude)
        .map((unit) => [Number(unit.latitude), Number(unit.longitude)]);

      if (validCoords.length === 0) {
        map.setView([14.5995, 120.9842], 12);
        return;
      }

      if (validCoords.length === 1) {
        map.setView(validCoords[0], 15);
      } else {
        const bounds = L.latLngBounds(validCoords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [80, 80],
            maxZoom: 16,
          });
        }
      }
    } catch (error) {
      console.error("Error updating map bounds:", error);
    }
  }, [map, units, L]);

  return null;
}

export default function MapView({ filteredUnits, onUnitClick }: MapViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [customIcon, setCustomIcon] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const unitsWithLocation = useMemo(() => {
    return filteredUnits.filter((unit) => {
      if (!unit.latitude || !unit.longitude) return false;

      const lat = Number(unit.latitude);
      const lng = Number(unit.longitude);

      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        isFinite(lat) &&
        isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        lat !== 0 &&
        lng !== 0
      );
    });
  }, [filteredUnits]);

  const initialCenter: [number, number] = useMemo(() => {
    if (unitsWithLocation.length > 0) {
      const latSum = unitsWithLocation.reduce(
        (sum, unit) => sum + Number(unit.latitude),
        0
      );
      const lngSum = unitsWithLocation.reduce(
        (sum, unit) => sum + Number(unit.longitude),
        0
      );
      return [
        latSum / unitsWithLocation.length,
        lngSum / unitsWithLocation.length,
      ];
    }
    return [14.5995, 120.9842];
  }, [unitsWithLocation]);

  useEffect(() => {
    if (typeof window !== "undefined" && isClient) {
      import("leaflet").then((L) => {
        const leaflet = L.default || L;

        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        const icon = leaflet.divIcon({
          html: `
            <div class="map-marker-container">
              <div class="map-marker-pulse"></div>
              <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.15"/>
                </filter>
                <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 28 18 28s18-14.5 18-28c0-9.941-8.059-18-18-18z" fill="#10B981" filter="url(#marker-shadow)"/>
                <circle cx="18" cy="18" r="8" fill="white"/>
                <circle cx="18" cy="18" r="4" fill="#10B981"/>
              </svg>
            </div>
          `,
          className: "custom-marker-icon",
          iconSize: [36, 46],
          iconAnchor: [18, 46],
          popupAnchor: [0, -46],
        });
        setCustomIcon(icon);
      });
    }
  }, [isClient]);

  const propertiesCount = useMemo(() => {
    const uniqueProperties = new Set(
      unitsWithLocation.map((u) => u.property_id)
    );
    return uniqueProperties.size;
  }, [unitsWithLocation]);

  if (!isClient) {
    return (
      <div className="flex-1 relative min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-500 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-emerald-400 mx-auto opacity-20"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Initializing map...</p>
          <p className="text-gray-400 text-sm mt-1">Setting up your view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative min-h-[600px] lg:min-h-screen">
      <style jsx global>{`
        .map-marker-container {
          position: relative;
          animation: marker-bounce 2s ease-in-out infinite;
        }

        .map-marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.2);
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955)
            infinite;
        }

        @keyframes marker-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.33);
            opacity: 1;
          }
          80%,
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      `}</style>

      {/* Map Container */}
      <div className="absolute inset-0 w-full h-full">
        {customIcon && (
          <MapContainer
            center={initialCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            className="z-0"
            zoomControl={!isMobileView}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapBoundsUpdater units={unitsWithLocation} />

            {unitsWithLocation.map((unit) => (
              <Marker
                key={unit.unit_id}
                position={[Number(unit.latitude), Number(unit.longitude)]}
                icon={customIcon}
                eventHandlers={{
                  click: () => setSelectedUnit(unit),
                }}
              />
            ))}
          </MapContainer>
        )}
      </div>

      {/* Mobile Zoom Controls */}
      {isMobileView && (
        <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-[400]">
          <button
            className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 active:scale-95"
            aria-label="Zoom in"
          >
            <BsZoomIn className="text-gray-700 text-xl" />
          </button>
          <button
            className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 active:scale-95"
            aria-label="Zoom out"
          >
            <BsZoomOut className="text-gray-700 text-xl" />
          </button>
        </div>
      )}

      <div
        className={`absolute ${
          isMobileView ? "top-2 left-2 right-2" : "top-4 right-4"
        } z-[400] transition-all duration-300`}
      >
        <div
          className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden transition-all duration-300 ${
            isLegendMinimized
              ? "max-w-[60px]"
              : isMobileView
              ? "max-w-full"
              : "max-w-[220px]"
          }`}
        >
          <div
            className={`p-3 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-b border-gray-100 ${
              isMobileView && !isLegendMinimized
                ? "flex justify-between items-center"
                : ""
            }`}
          >
            <h3
              className={`font-bold text-gray-800 flex items-center gap-2 text-sm ${
                isLegendMinimized ? "justify-center" : ""
              }`}
            >
              {!isLegendMinimized ? (
                <>
                  <HiLocationMarker className="text-emerald-500 text-lg" />
                  <span>Map Overview</span>
                </>
              ) : (
                <HiLocationMarker className="text-emerald-500 text-lg" />
              )}
            </h3>
            <button
              onClick={() => setIsLegendMinimized(!isLegendMinimized)}
              className={`${
                isMobileView || !isLegendMinimized ? "block" : "hidden"
              } p-1.5 hover:bg-gray-100 rounded-lg transition-colors`}
              aria-label={
                isLegendMinimized ? "Expand legend" : "Minimize legend"
              }
            >
              {isLegendMinimized ? (
                <FaExpandAlt className="text-gray-600 text-xs" />
              ) : (
                <FaCompress className="text-gray-600 text-xs" />
              )}
            </button>
          </div>

          {!isLegendMinimized && (
            <div
              className={`p-3 space-y-2 ${isMobileView ? "flex gap-3" : ""}`}
            >
              <div
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 p-3 text-white shadow-lg ${
                  isMobileView ? "flex-1" : ""
                }`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <FaHome className="text-white/80" />
                    <p className="text-xs font-medium text-white/90">
                      Available
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {unitsWithLocation.length}
                  </p>
                  <p className="text-xs text-white/80 mt-1">Total Units</p>
                </div>
              </div>

              <div
                className={`bg-gray-50 rounded-xl p-3 border border-gray-100 ${
                  isMobileView ? "flex-1" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center">
                    <FaBuilding className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Properties</p>
                    <p className="text-lg font-bold text-gray-800">
                      {propertiesCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedUnit && (
        <div
          className={`fixed ${
            isMobileView
              ? "inset-x-0 bottom-0"
              : "bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 sm:w-[420px]"
          } bg-white/98 backdrop-blur-xl ${
            isMobileView ? "rounded-t-3xl" : "rounded-3xl"
          } shadow-2xl z-[500] border border-gray-100 animate-slide-up`}
        >
          {isMobileView && (
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
          )}

          <div className="p-5">
            <button
              onClick={() => setSelectedUnit(null)}
              className="absolute top-4 right-4 p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              aria-label="Close panel"
            >
              <FaTimes className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            <div className={`${isMobileView ? "space-y-4" : "flex gap-4"}`}>
              <div
                className={`${
                  isMobileView ? "w-full h-48" : "w-28 h-28"
                } rounded-2xl overflow-hidden flex-shrink-0 shadow-lg bg-gradient-to-br from-gray-100 to-gray-200`}
              >
                {selectedUnit.photos?.[0] ? (
                  <Image
                    src={selectedUnit.photos[0]}
                    alt={`Unit ${selectedUnit.unit_name}`}
                    width={isMobileView ? 400 : 112}
                    height={isMobileView ? 192 : 112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BsImageAlt className="text-gray-400 text-3xl" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-md">
                    <HiSparkles className="text-white/90" />
                    <span>Unit {selectedUnit.unit_name}</span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">
                  {selectedUnit.property_name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                  <FaBuilding className="text-gray-400" />
                  {selectedUnit.property_type}
                </p>

                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 mb-4 border border-emerald-100">
                  <p className="text-xs text-gray-600 mb-1">Monthly Rent</p>
                  <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 text-2xl">
                    {formatCurrency(Number(selectedUnit.rent_amount))}
                  </p>
                </div>

                <button
                  onClick={() =>
                    onUnitClick(selectedUnit.unit_id, selectedUnit.property_id)
                  }
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>View Full Details</span>
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {unitsWithLocation.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[999] bg-gradient-to-br from-gray-50/95 to-gray-100/95 backdrop-blur-sm">
          <div className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-md mx-4 border border-gray-100">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <FaMapMarkerAlt className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              No Units Available
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We couldn't find any properties with valid locations matching your
              criteria.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
              <FaFilter className="text-gray-400" />
              <span>Try adjusting your filters</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: ${isMobileView
              ? "translateY(100%)"
              : "translate(-50%, 100%)"};
            opacity: 0;
          }
          to {
            transform: ${isMobileView ? "translateY(0)" : "translate(-50%, 0)"};
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
