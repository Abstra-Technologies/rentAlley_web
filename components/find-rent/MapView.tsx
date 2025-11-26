"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  X,
  MapPin,
  Building2,
  Maximize2,
  Minimize2,
  Home,
  Shield,
  BadgeCheck,
  List,
  Map as MapIcon,
  ChevronRight,
  ImageIcon,
  Sparkles,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import type { Unit } from "../../types/types";

interface MapViewProps {
  filteredUnits: Unit[];
  onUnitClick: (unitId: string, propertyId: string) => void;
}

// Dynamic imports for Leaflet
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
    maximumFractionDigits: 0,
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
  } catch {
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
            padding: [60, 60],
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
  const [showStats, setShowStats] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showListView, setShowListView] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

  // Group units by location for overlapping markers
  const groupedUnits = useMemo(() => {
    const groups = new Map<string, Unit[]>();

    unitsWithLocation.forEach((unit) => {
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
    return [14.5995, 120.9842]; // Manila default
  }, [unitsWithLocation]);

  // Create custom marker icon
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
            <div class="upkyp-marker">
              <div class="upkyp-marker-pulse"></div>
              <div class="upkyp-marker-pin">
                <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#10B981;stop-opacity:1" />
                    </linearGradient>
                    <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/>
                    </filter>
                  </defs>
                  <path d="M18 0C8.059 0 0 8.059 0 18c0 14 18 26 18 26s18-12 18-26C36 8.059 27.941 0 18 0z" 
                        fill="url(#pinGradient)" filter="url(#pinShadow)"/>
                  <circle cx="18" cy="16" r="7" fill="white"/>
                  <circle cx="18" cy="16" r="4" fill="#10B981"/>
                </svg>
              </div>
            </div>
          `,
          className: "upkyp-marker-container",
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -44],
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

  const handleClosePanel = useCallback(() => {
    setSelectedUnit(null);
  }, []);

  if (!isClient) {
    return (
      <div className="flex-1 h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-600 animate-bounce" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex h-full">
      {/* Global Styles */}
      <style jsx global>{`
        .upkyp-marker {
          position: relative;
        }

        .upkyp-marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.2),
            rgba(16, 185, 129, 0.2)
          );
          animation: markerPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .upkyp-marker-pin {
          position: relative;
          animation: markerFloat 4s ease-in-out infinite;
        }

        @keyframes markerPulse {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        @keyframes markerFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .upkyp-marker-container:hover .upkyp-marker-pin {
          animation: markerBounce 0.4s ease-out;
        }

        @keyframes markerBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .leaflet-popup-content {
          margin: 0;
          min-width: 220px;
        }

        .leaflet-popup-tip {
          display: none;
        }
      `}</style>

      {/* Desktop List Sidebar */}
      {showListView && !isMobile && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-emerald-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-900 text-sm">
                  {unitsWithLocation.length} Properties
                </span>
              </div>
              <button
                onClick={() => setShowListView(false)}
                className="p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {unitsWithLocation.map((unit) => (
              <button
                key={unit.unit_id}
                onClick={() => setSelectedUnit(unit)}
                className={`
                  w-full p-3 rounded-xl text-left transition-all duration-200
                  ${
                    selectedUnit?.unit_id === unit.unit_id
                      ? "bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-emerald-200 shadow-sm"
                      : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                  }
                `}
              >
                <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                  {unit.property_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Unit {unit.unit_name}
                </p>
                <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mt-2">
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
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapBoundsUpdater units={unitsWithLocation} />

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
                >
                  <Popup maxWidth={280} closeButton={false}>
                    <div className="p-3">
                      {hasMultiple ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                              {group.length}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                {group.length} Units Available
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {firstUnit.property_name}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {group.map((unit) => (
                              <button
                                key={unit.unit_id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUnit(unit);
                                }}
                                className="w-full p-2.5 text-left rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
                              >
                                <p className="font-medium text-xs text-gray-900">
                                  Unit {unit.unit_name}
                                </p>
                                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                                  {formatCurrency(Number(unit.rent_amount))}/mo
                                </p>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">
                            {firstUnit.property_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Unit {firstUnit.unit_name}
                          </p>
                          <p className="text-base font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                            {formatCurrency(Number(firstUnit.rent_amount))}/mo
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUnit(firstUnit);
                            }}
                            className="w-full mt-3 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all"
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

        {/* Desktop List Toggle Button */}
        {!isMobile && (
          <button
            onClick={() => setShowListView(!showListView)}
            className="absolute top-4 left-4 z-[35] flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all text-sm font-medium text-gray-700"
          >
            {showListView ? (
              <>
                <MapIcon className="w-4 h-4 text-emerald-600" />
                Map Only
              </>
            ) : (
              <>
                <List className="w-4 h-4 text-emerald-600" />
                Show List
              </>
            )}
          </button>
        )}

        {/* Stats Panel */}
        {showStats && (
          <div
            className={`absolute ${
              isMobile ? "top-2 right-2" : "top-4 right-4"
            } z-[35]`}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden min-w-[160px]">
              <div className="p-3 bg-gradient-to-r from-blue-50/80 to-emerald-50/80 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm text-gray-900">Stats</span>
                </div>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-1 hover:bg-white/60 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <div className="bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl p-3 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                    Available
                  </p>
                  <p className="text-2xl font-bold">
                    {unitsWithLocation.length}
                  </p>
                  <p className="text-xs opacity-70">Units</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
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

        {/* Collapsed Stats Button */}
        {!showStats && (
          <button
            onClick={() => setShowStats(true)}
            className={`absolute ${
              isMobile ? "top-2 right-2" : "top-4 right-4"
            } z-[35] w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:scale-105 transition-all`}
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Selected Unit Panel */}
        {selectedUnit && (
          <div
            className={`fixed z-[500] ${
              isMobile
                ? "inset-x-0 bottom-0"
                : "bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md"
            }`}
          >
            <div
              className={`bg-white ${
                isMobile ? "rounded-t-3xl" : "rounded-2xl mx-4"
              } shadow-2xl border border-gray-200/50 overflow-hidden`}
            >
              {/* Mobile Drag Handle */}
              {isMobile && (
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
              )}

              <div className="p-4 sm:p-5">
                {/* Close Button */}
                <button
                  onClick={handleClosePanel}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>

                <div className={`${isMobile ? "space-y-4" : "flex gap-4"}`}>
                  {/* Image */}
                  <div
                    className={`${
                      isMobile ? "w-full h-36" : "w-28 h-28"
                    } rounded-xl overflow-hidden bg-gray-100 relative flex-shrink-0`}
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
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <div className="p-1.5 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full shadow-lg">
                        <BadgeCheck className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {/* Unit Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs font-bold rounded-full mb-2">
                      <Sparkles className="w-3 h-3" />
                      Unit {selectedUnit.unit_name}
                    </div>

                    {/* Property Name */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                        {selectedUnit.property_name}
                      </h3>
                    </div>

                    {/* Property Type */}
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                      <Building2 className="w-3.5 h-3.5" />
                      {selectedUnit.property_type.replace(/_/g, " ")}
                    </p>

                    {/* Verified Badge */}
                    <div className="mb-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-100/50">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <p className="text-xs text-gray-700 font-medium">
                          <span className="font-bold text-blue-600">
                            Verified
                          </span>{" "}
                          · Background checked
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                        Monthly Rent
                      </p>
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCurrency(Number(selectedUnit.rent_amount))}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() =>
                        onUnitClick(
                          selectedUnit.unit_id,
                          selectedUnit.property_id
                        )
                      }
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      View Full Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {unitsWithLocation.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[40] bg-white/95 backdrop-blur-sm">
            <div className="text-center p-8 max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No map locations
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                No properties with valid locations match your current filters.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
