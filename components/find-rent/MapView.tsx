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
  FaHome,
  FaShieldAlt,
  FaCheckCircle,
  FaList,
  FaMap,
} from "react-icons/fa";
import { BsImageAlt } from "react-icons/bs";
import { HiLocationMarker, HiSparkles } from "react-icons/hi";
import { MdVerifiedUser } from "react-icons/md";

import "leaflet/dist/leaflet.css";
import type { Unit } from "../../types/types";

interface MapViewProps {
  filteredUnits: Unit[];
  onUnitClick: (unitId: string, propertyId: string) => void;
}

// Dynamic imports
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

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
  const [showLegend, setShowLegend] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showListView, setShowListView] = useState(false);

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

  // Group units by location to handle overlapping markers
  const groupedUnits = useMemo(() => {
    const groups = new Map<string, Unit[]>();

    unitsWithLocation.forEach((unit) => {
      // Round coordinates to 5 decimal places to group nearby units
      const lat = Number(unit.latitude).toFixed(5);
      const lng = Number(unit.longitude).toFixed(5);
      const key = `${lat},${lng}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(unit);
    });

    return Array.from(groups.values());
  }, [unitsWithLocation]);

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
              <svg width="36" height="45" viewBox="0 0 36 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.35"/>
                  </filter>
                  <linearGradient id="markerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#10B981;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 27 18 27s18-13.5 18-27c0-9.941-8.059-18-18-18z" fill="url(#markerGradient)" filter="url(#marker-shadow)"/>
                <circle cx="18" cy="18" r="8" fill="white"/>
                <circle cx="18" cy="18" r="5" fill="#10B981"/>
              </svg>
            </div>
          `,
          className: "custom-marker-icon",
          iconSize: [36, 45],
          iconAnchor: [18, 45],
          popupAnchor: [0, -45],
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
          <HiLocationMarker className="mx-auto text-emerald-500 text-4xl mb-4 animate-bounce" />
          <p className="text-gray-700 font-semibold">Initializing Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex flex-col lg:flex-row h-[calc(100vh-180px)]">
      <style jsx global>{`
        .map-marker-container {
          position: relative;
          animation: marker-float 3s ease-in-out infinite;
        }

        .map-marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 55px;
          height: 55px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.3),
            rgba(16, 185, 129, 0.3)
          );
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955)
            infinite;
        }

        @keyframes marker-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.4);
            opacity: 1;
          }
          80%,
          100% {
            transform: translate(-50%, -50%) scale(2.2);
            opacity: 0;
          }
        }

        .custom-marker-icon:hover .map-marker-container {
          animation: marker-bounce 0.5s ease-in-out;
        }

        @keyframes marker-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }

        .leaflet-popup-content {
          margin: 0;
          min-width: 200px;
        }
      `}</style>

      {/* List View Sidebar - Desktop */}
      {showListView && !isMobileView && (
        <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 sticky top-0 z-10">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <FaList className="text-emerald-600" />
              <span>{unitsWithLocation.length} Properties</span>
            </h3>
          </div>
          <div className="p-2 space-y-2">
            {unitsWithLocation.map((unit) => (
              <button
                key={unit.unit_id}
                onClick={() => setSelectedUnit(unit)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedUnit?.unit_id === unit.unit_id
                    ? "bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                  {unit.property_name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Unit {unit.unit_name}
                </p>
                <p className="text-sm font-bold text-emerald-600 mt-2">
                  {formatCurrency(Number(unit.rent_amount))}/mo
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        {customIcon && (
          <MapContainer
            center={initialCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapBoundsUpdater units={unitsWithLocation} />

            {/* Render markers - grouped by location */}
            {groupedUnits.map((group, groupIndex) => {
              const firstUnit = group[0];
              const hasMultiple = group.length > 1;

              return (
                <Marker
                  key={`${firstUnit.unit_id}-${groupIndex}`}
                  position={[
                    Number(firstUnit.latitude),
                    Number(firstUnit.longitude),
                  ]}
                  icon={customIcon}
                  // REMOVED: eventHandlers={{ click: () => setSelectedUnit(firstUnit) }}
                  // This allows the Popup to show first by default.
                >
                  <Popup>
                    <div className="p-3">
                      {hasMultiple ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                              {group.length}
                            </div>
                            <p className="font-bold text-gray-900 text-sm">
                              {group.length} Units Available
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            at {firstUnit.property_name}
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {group.map((unit) => (
                              <button
                                key={unit.unit_id}
                                // ACTION: Sets the custom state here, triggering the fixed panel
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUnit(unit);
                                }}
                                className="w-full p-2 text-left rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                              >
                                <p className="font-semibold text-xs text-gray-900">
                                  Unit {unit.unit_name}
                                </p>
                                <p className="text-xs text-emerald-600 font-bold mt-1">
                                  {formatCurrency(Number(unit.rent_amount))}/mo
                                </p>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-gray-900 text-sm mb-1">
                            {firstUnit.property_name}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Unit {firstUnit.unit_name}
                          </p>
                          <p className="text-sm font-bold text-emerald-600 mb-3">
                            {formatCurrency(Number(firstUnit.rent_amount))}/mo
                          </p>
                          <button
                            // ACTION: Sets the custom state here, triggering the fixed panel
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUnit(firstUnit);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all"
                          >
                            View Details
                          </button>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Toggle List View Button - Desktop - FIXED Z-INDEX */}
        {!isMobileView && (
          <button
            onClick={() => setShowListView(!showListView)}
            className="absolute top-4 left-4 z-[35] bg-white/98 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            {showListView ? (
              <>
                <FaMap className="text-emerald-600" />
                Map Only
              </>
            ) : (
              <>
                <FaList className="text-emerald-600" />
                Show List
              </>
            )}
          </button>
        )}

        {/* Map Stats - Compact & Fixed - FIXED Z-INDEX */}
        {showLegend && (
          <div
            className={`absolute ${
              isMobileView ? "top-2 right-2" : "top-4 right-4"
            } z-[35] max-w-[200px]`}
          >
            <div className="bg-white/98 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="text-emerald-600 text-lg" />
                  <span className="font-bold text-sm text-gray-900">Stats</span>
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="p-1 hover:bg-white/60 rounded transition-colors"
                >
                  <FaCompress className="text-gray-600 text-xs" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <div className="bg-gradient-to-br from-blue-500 to-emerald-600 rounded-lg p-3 text-white">
                  <p className="text-xs font-semibold opacity-90 uppercase tracking-wide mb-1">
                    Available
                  </p>
                  <p className="text-2xl font-bold">
                    {unitsWithLocation.length}
                  </p>
                  <p className="text-xs opacity-80">Units</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">
                    Properties
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {propertiesCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="absolute top-4 right-4 z-[35] w-10 h-10 bg-white/98 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:scale-110 transition-all"
          >
            <FaExpandAlt className="text-gray-600 text-sm" />
          </button>
        )}

        {/* Selected Unit Panel */}
        {selectedUnit && (
          <div
            className={`fixed ${
              isMobileView
                ? "inset-x-0 bottom-0"
                : "bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 sm:w-[480px]"
            } bg-white/98 backdrop-blur-xl ${
              isMobileView ? "rounded-t-3xl" : "rounded-3xl"
            } shadow-2xl z-[500] border border-gray-200/50`}
          >
            {isMobileView && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-16 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
            )}

            <div className="p-5">
              <button
                onClick={() => setSelectedUnit(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <FaTimes className="text-gray-400 hover:text-gray-700" />
              </button>

              <div className={`${isMobileView ? "space-y-4" : "flex gap-4"}`}>
                <div
                  className={`${
                    isMobileView ? "w-full h-48" : "w-32 h-32"
                  } rounded-xl overflow-hidden shadow-md bg-gray-100 relative flex-shrink-0`}
                >
                  {selectedUnit.photos?.[0] ? (
                    <Image
                      src={selectedUnit.photos[0]}
                      alt={`Unit ${selectedUnit.unit_name}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BsImageAlt className="text-gray-400 text-3xl" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <div className="backdrop-blur-md bg-gradient-to-br from-blue-600 to-emerald-600 p-1.5 rounded-full shadow-lg border-2 border-white/30">
                      <MdVerifiedUser className="text-white text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs font-bold rounded-full mb-3">
                    <HiSparkles />
                    Unit {selectedUnit.unit_name}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                      {selectedUnit.property_name}
                    </h3>
                    <FaCheckCircle className="text-blue-500 flex-shrink-0 text-sm" />
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                    <FaBuilding className="text-gray-400" />
                    {selectedUnit.property_type.replace(/_/g, " ")}
                  </p>

                  <div className="mb-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-100/50">
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="text-blue-600 text-xs" />
                      <p className="text-xs text-gray-700 font-medium">
                        <span className="font-bold text-blue-600">
                          Verified Safe
                        </span>{" "}
                        · Background checked
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-3 mb-4 border border-blue-100">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">
                      Monthly Rent
                    </p>
                    <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 text-2xl">
                      {formatCurrency(Number(selectedUnit.rent_amount))}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onUnitClick(
                        selectedUnit.unit_id,
                        selectedUnit.property_id
                      )
                    }
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    View Full Details
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {unitsWithLocation.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[999] bg-white/95 backdrop-blur-sm">
            <div className="text-center p-8 max-w-md">
              <FaMapMarkerAlt className="mx-auto text-gray-300 text-5xl mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Map Locations
              </h3>
              <p className="text-gray-600 leading-relaxed">
                No properties with valid locations match your filters.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
