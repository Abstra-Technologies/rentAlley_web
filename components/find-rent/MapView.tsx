"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sofa,
  Navigation,
  Minus,
  Plus,
  Eye,
  Home,
} from "lucide-react";
import Image from "next/image";
import { Unit } from "@/types/types";
import { formatCurrency, formatLocation } from "./utils";

import "leaflet/dist/leaflet.css";

// ============================================
// TYPES
// ============================================
interface MapViewProps {
  units: Unit[];
  onUnitClick: (unitId: string, propertyId: string) => void;
  onSelectUnit?: (unit: Unit | null) => void;
}

interface MarkerGroup {
  id: string;
  lat: number;
  lng: number;
  units: Unit[];
  isCluster: boolean;
}

// ============================================
// CLUSTERING LOGIC
// ============================================
function groupOverlappingMarkers(units: Unit[], zoom: number): MarkerGroup[] {
  const unitsWithCoords = units.filter((u) => u.latitude && u.longitude);
  if (unitsWithCoords.length === 0) return [];

  const baseThreshold = 0.002;
  const threshold = baseThreshold * Math.pow(2, 15 - zoom);

  const groups: MarkerGroup[] = [];
  const processed = new Set<string>();

  for (const unit of unitsWithCoords) {
    if (processed.has(unit.unit_id)) continue;

    const unitLat = Number(unit.latitude);
    const unitLng = Number(unit.longitude);
    const nearbyUnits: Unit[] = [unit];
    processed.add(unit.unit_id);

    for (const otherUnit of unitsWithCoords) {
      if (processed.has(otherUnit.unit_id)) continue;

      const otherLat = Number(otherUnit.latitude);
      const otherLng = Number(otherUnit.longitude);
      const distance = Math.sqrt(
        Math.pow(unitLat - otherLat, 2) + Math.pow(unitLng - otherLng, 2),
      );

      if (distance < threshold) {
        nearbyUnits.push(otherUnit);
        processed.add(otherUnit.unit_id);
      }
    }

    const avgLat =
      nearbyUnits.reduce((sum, u) => sum + Number(u.latitude), 0) /
      nearbyUnits.length;
    const avgLng =
      nearbyUnits.reduce((sum, u) => sum + Number(u.longitude), 0) /
      nearbyUnits.length;

    groups.push({
      id: nearbyUnits.map((u) => u.unit_id).join("-"),
      lat: avgLat,
      lng: avgLng,
      units: nearbyUnits,
      isCluster: nearbyUnits.length > 1,
    });
  }

  return groups;
}

// ============================================
// MULTI-UNIT BOTTOM SHEET
// ============================================
function MultiUnitSheet({
  units,
  onSelectUnit,
  onClose,
}: {
  units: Unit[];
  onSelectUnit: (unit: Unit) => void;
  onClose: () => void;
}) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) onClose();
    setDragY(0);
  };

  return (
    <div
      className="bg-white rounded-t-2xl shadow-2xl overflow-hidden"
      style={{
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      }}
    >
      <div
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        <div>
          <h3 className="font-bold text-slate-900">
            {units.length} units here
          </h3>
          <p className="text-sm text-slate-500">Select one to view</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="max-h-[50vh] overflow-y-auto border-t border-slate-100">
        {units.map((unit, index) => {
          const images = unit.photos?.length > 0 ? unit.photos : [];

          return (
            <button
              key={unit.unit_id}
              type="button"
              onClick={() => onSelectUnit(unit)}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors ${
                index !== units.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                {images[0] ? (
                  <Image
                    src={images[0]}
                    alt={unit.unit_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {unit.unit_name}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {unit.property_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {unit.unit_size > 0 && (
                    <span className="text-xs text-slate-500">
                      {unit.unit_size} sqm
                    </span>
                  )}
                  {unit.unit_size > 0 && unit.furnish && (
                    <span className="text-slate-300">•</span>
                  )}
                  {unit.furnish && (
                    <span className="text-xs text-slate-500 capitalize">
                      {unit.furnish.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-emerald-600">
                  {formatCurrency(Number(unit.rent_amount))}
                </p>
                <p className="text-xs text-slate-400">/month</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// UNIT CARD
// ============================================
function UnitCard({
  unit,
  onClose,
  onViewDetails,
}: {
  unit: Unit;
  onClose: () => void;
  onViewDetails: () => void;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  const images = unit.photos?.length > 0 ? unit.photos : [];

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) onClose();
    setDragY(0);
  };

  return (
    <div
      className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      style={{
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      }}
    >
      <div
        className="flex sm:hidden justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-40 h-32 sm:h-auto sm:aspect-square bg-slate-100 flex-shrink-0">
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImage]}
                alt={unit.unit_name}
                fill
                className="object-cover"
              />
              {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.slice(0, 4).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImage(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentImage ? "bg-white w-3" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-10 h-10 text-slate-300" />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-4">
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate">
                {unit.unit_name}
              </p>
              <p className="text-sm text-slate-500 truncate">
                {unit.property_name}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-emerald-600">
                {formatCurrency(Number(unit.rent_amount))}
              </p>
              <p className="text-xs text-slate-400">/mo</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            {unit.unit_size > 0 && <span>{unit.unit_size} sqm</span>}
            {unit.unit_size > 0 && unit.furnish && (
              <span className="text-slate-300">•</span>
            )}
            {unit.furnish && (
              <span className="capitalize">
                {unit.furnish.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">
              {formatLocation(unit.city, unit.province)}
            </span>
          </div>

          <button
            type="button"
            onClick={onViewDetails}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LEAFLET MAP COMPONENT (Separate to handle lifecycle)
// ============================================
function LeafletMap({
  units,
  markerGroups,
  selectedUnit,
  showMultiPanel,
  multiPanelUnits,
  hoveredGroupId,
  onGroupClick,
  onMapClick,
  onHover,
  mapRef,
  setZoom,
}: {
  units: Unit[];
  markerGroups: MarkerGroup[];
  selectedUnit: Unit | null;
  showMultiPanel: boolean;
  multiPanelUnits: Unit[];
  hoveredGroupId: string | null;
  onGroupClick: (group: MarkerGroup) => void;
  onMapClick: () => void;
  onHover: (id: string | null) => void;
  mapRef: React.MutableRefObject<any>;
  setZoom: (z: number) => void;
}) {
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || leafletMapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Clear any existing map on the container
      if ((containerRef.current as any)?._leaflet_id) {
        return;
      }

      const map = L.map(containerRef.current!, {
        center: [14.5995, 120.9842],
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      map.on("click", onMapClick);
      map.on("zoomend", () => setZoom(map.getZoom()));

      leafletMapRef.current = map;
      mapRef.current = map;
      setMapReady(true);

      // Fit bounds to units
      const unitsWithCoords = units.filter((u) => u.latitude && u.longitude);
      if (unitsWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          unitsWithCoords.map((u) => [Number(u.latitude), Number(u.longitude)]),
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.off();
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when groups change
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;

    const L = require("leaflet");
    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markerGroups.forEach((group) => {
      const count = group.units.length;
      const lowestPrice = Math.min(
        ...group.units.map((u) => Number(u.rent_amount)),
      );

      const formatShortPrice = (amount: number) => {
        if (amount >= 1000) {
          return `₱${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
        }
        return `₱${amount}`;
      };
      const priceText = formatShortPrice(lowestPrice);

      const isSelected =
        (group.units.length === 1 &&
          selectedUnit?.unit_id === group.units[0].unit_id) ||
        (showMultiPanel &&
          group.units.some((u) => multiPanelUnits.includes(u)));
      const isHovered = hoveredGroupId === group.id;
      const isActive = isSelected || isHovered;

      const iconHtml = `
        <div style="
          transform: translate(-50%, -50%);
          background: ${isActive ? "#000000" : "#ffffff"};
          color: ${isActive ? "#ffffff" : "#000000"};
          padding: 8px 12px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        ">
          ${priceText}${
            count > 1
              ? `<span style="
            background: ${isActive ? "rgba(255,255,255,0.2)" : "#000000"};
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
          ">${count}</span>`
              : ""
          }
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "upkyp-price-marker",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([group.lat, group.lng], { icon })
        .addTo(map)
        .on("click", () => onGroupClick(group))
        .on("mouseover", () => onHover(group.id))
        .on("mouseout", () => onHover(null));

      markersRef.current.push(marker);
    });
  }, [
    markerGroups,
    selectedUnit,
    showMultiPanel,
    multiPanelUnits,
    hoveredGroupId,
    mapReady,
  ]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function MapView({
  units,
  onUnitClick,
  onSelectUnit,
}: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showMultiPanel, setShowMultiPanel] = useState(false);
  const [multiPanelUnits, setMultiPanelUnits] = useState<Unit[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const markerGroups = useMemo(
    () => groupOverlappingMarkers(units, zoom),
    [units, zoom],
  );

  const unitsOnMap = useMemo(
    () => units.filter((u) => u.latitude && u.longitude).length,
    [units],
  );

  const handleMapClick = useCallback(() => {
    setSelectedUnit(null);
    setShowMultiPanel(false);
    onSelectUnit?.(null);
  }, [onSelectUnit]);

  const handleGroupClick = useCallback(
    (group: MarkerGroup) => {
      if (group.units.length === 1) {
        setSelectedUnit(group.units[0]);
        setShowMultiPanel(false);
        onSelectUnit?.(group.units[0]);
      } else {
        setMultiPanelUnits(group.units);
        setShowMultiPanel(true);
        setSelectedUnit(null);
      }
      mapRef.current?.panTo([group.lat, group.lng]);
    },
    [onSelectUnit],
  );

  const handleUnitSelectFromPanel = useCallback(
    (unit: Unit) => {
      setSelectedUnit(unit);
      setShowMultiPanel(false);
      onSelectUnit?.(unit);
    },
    [onSelectUnit],
  );

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;
    const L = require("leaflet");
    const unitsWithCoords = units.filter((u) => u.latitude && u.longitude);
    if (unitsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        unitsWithCoords.map((u) => [Number(u.latitude), Number(u.longitude)]),
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [units]);

  if (!isClient) {
    return (
      <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden">
      {/* Map */}
      <LeafletMap
        units={units}
        markerGroups={markerGroups}
        selectedUnit={selectedUnit}
        showMultiPanel={showMultiPanel}
        multiPanelUnits={multiPanelUnits}
        hoveredGroupId={hoveredGroupId}
        onGroupClick={handleGroupClick}
        onMapClick={handleMapClick}
        onHover={setHoveredGroupId}
        mapRef={mapRef}
        setZoom={setZoom}
      />

      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-[1000]">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all border border-slate-200"
        >
          <Plus className="w-4 h-4 text-slate-600" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all border border-slate-200"
        >
          <Minus className="w-4 h-4 text-slate-600" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all border border-slate-200"
        >
          <Navigation className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Unit Count */}
      <div className="absolute top-3 left-3 px-3 py-1.5 bg-white rounded-lg shadow-md z-[1000] border border-slate-200">
        <span className="text-sm font-medium text-slate-600">
          <span className="font-bold text-teal-600">{unitsOnMap}</span> on map
        </span>
      </div>

      {/* Multi-Unit Sheet */}
      {showMultiPanel && multiPanelUnits.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 sm:left-3 sm:right-auto sm:bottom-3 sm:w-[360px] z-[1000]">
          <MultiUnitSheet
            units={multiPanelUnits}
            onSelectUnit={handleUnitSelectFromPanel}
            onClose={() => {
              setShowMultiPanel(false);
              onSelectUnit?.(null);
            }}
          />
        </div>
      )}

      {/* Unit Card */}
      {selectedUnit && !showMultiPanel && (
        <div className="absolute inset-x-0 bottom-0 sm:left-3 sm:right-auto sm:bottom-3 sm:w-[360px] z-[1000]">
          <UnitCard
            unit={selectedUnit}
            onClose={() => {
              setSelectedUnit(null);
              onSelectUnit?.(null);
            }}
            onViewDetails={() =>
              onUnitClick(selectedUnit.unit_id, selectedUnit.property_id)
            }
          />
        </div>
      )}
    </div>
  );
}
