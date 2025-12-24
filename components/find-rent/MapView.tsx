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
  BadgeCheck,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { Unit } from "@/types/types";
import {
  formatCurrency,
  formatLocation,
  SPRING,
  CLUSTER_CONFIG,
} from "./utils";

interface MapViewProps {
  units: Unit[];
  onUnitClick: (unitId: string, propertyId: string) => void;
  selectedUnitId?: string;
  onSelectUnit?: (unit: Unit | null) => void;
}

// Types for grouped markers
interface MarkerGroup {
  id: string;
  lat: number;
  lng: number;
  units: Unit[];
  isCluster: boolean;
}

// Mercator projection helper
function project(latLng: { lat: number; lng: number }) {
  const TILE_SIZE = 256;
  let siny = Math.sin((latLng.lat * Math.PI) / 180);
  siny = Math.min(Math.max(siny, -0.9999), 0.9999);
  return {
    x: TILE_SIZE * (0.5 + latLng.lng / 360),
    y: TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)),
  };
}

// Group overlapping markers by proximity
function groupOverlappingMarkers(
  units: Unit[],
  zoom: number,
  mapWidth: number,
  mapHeight: number,
  center: { lat: number; lng: number }
): MarkerGroup[] {
  const unitsWithCoords = units.filter((u) => u.latitude && u.longitude);
  if (unitsWithCoords.length === 0) return [];

  const scale = Math.pow(2, zoom);
  const getPixelPos = (lat: number, lng: number) => {
    const worldCoord = project({ lat, lng });
    const centerWorldCoord = project(center);
    return {
      x: (worldCoord.x - centerWorldCoord.x) * scale + mapWidth / 2,
      y: (worldCoord.y - centerWorldCoord.y) * scale + mapHeight / 2,
    };
  };

  const groups: MarkerGroup[] = [];
  const processed = new Set<string>();

  for (const unit of unitsWithCoords) {
    if (processed.has(unit.unit_id)) continue;

    const unitLat = Number(unit.latitude);
    const unitLng = Number(unit.longitude);
    const unitPos = getPixelPos(unitLat, unitLng);

    const nearbyUnits: Unit[] = [unit];
    processed.add(unit.unit_id);

    for (const otherUnit of unitsWithCoords) {
      if (processed.has(otherUnit.unit_id)) continue;

      const otherLat = Number(otherUnit.latitude);
      const otherLng = Number(otherUnit.longitude);
      const otherPos = getPixelPos(otherLat, otherLng);

      const distance = Math.sqrt(
        Math.pow(unitPos.x - otherPos.x, 2) +
          Math.pow(unitPos.y - otherPos.y, 2)
      );

      if (distance < CLUSTER_CONFIG.overlapThreshold) {
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

// Calculate spiderfy positions
function getSpiderfyPositions(
  count: number,
  centerX: number,
  centerY: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const radius = CLUSTER_CONFIG.spiderfyRadius;

  if (count === 2) {
    positions.push({ x: centerX - radius / 2, y: centerY });
    positions.push({ x: centerX + radius / 2, y: centerY });
  } else if (count <= CLUSTER_CONFIG.maxSpiderfyItems) {
    const angleStep = (2 * Math.PI) / count;
    for (let i = 0; i < count; i++) {
      const angle = angleStep * i - Math.PI / 2;
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  }

  return positions;
}

// Cluster Marker Component
function ClusterMarker({
  group,
  isSelected,
  isHovered,
  isExpanded,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
}: {
  group: MarkerGroup;
  isSelected: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  style: React.CSSProperties;
}) {
  const count = group.units.length;
  const lowestPrice = Math.min(
    ...group.units.map((u) => Number(u.rent_amount))
  );

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        ...style,
        transform: `translate(-50%, -100%) ${
          isSelected || isExpanded
            ? "scale(1.15)"
            : isHovered
            ? "scale(1.1)"
            : "scale(1)"
        }`,
        transition: `transform 0.3s ${SPRING.snappy}`,
        zIndex: isSelected || isExpanded ? 100 : isHovered ? 50 : 10,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {count > 1 && !isExpanded && (
        <>
          <div
            className="absolute inset-0 bg-slate-200 rounded-full"
            style={{
              transform: "translate(4px, 4px) rotate(6deg)",
              opacity: 0.6,
            }}
          />
          <div
            className="absolute inset-0 bg-slate-300 rounded-full"
            style={{
              transform: "translate(2px, 2px) rotate(3deg)",
              opacity: 0.8,
            }}
          />
        </>
      )}

      <div
        className={`
          relative px-3 py-2 rounded-full font-bold text-sm whitespace-nowrap
          shadow-lg transition-all duration-300
          ${
            isSelected || isExpanded
              ? "bg-emerald-600 text-white shadow-emerald-600/40"
              : isHovered
              ? "bg-slate-900 text-white shadow-slate-900/30"
              : "bg-white text-slate-900 shadow-slate-900/10 border border-slate-200"
          }
        `}
      >
        <span className="flex items-center gap-1.5">
          {formatCurrency(lowestPrice)}
          {count > 1 && (
            <span
              className={`
                flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
                ${
                  isSelected || isExpanded || isHovered
                    ? "bg-white/20"
                    : "bg-emerald-500 text-white"
                }
              `}
            >
              {count}
            </span>
          )}
        </span>
      </div>

      <div
        className={`
          absolute left-1/2 -translate-x-1/2 w-0 h-0
          border-l-[8px] border-r-[8px] border-t-[10px]
          border-l-transparent border-r-transparent
          transition-colors duration-300
          ${
            isSelected || isExpanded
              ? "border-t-emerald-600"
              : isHovered
              ? "border-t-slate-900"
              : "border-t-white"
          }
        `}
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
      />

      {(isSelected || isExpanded) && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
        </div>
      )}
    </div>
  );
}

// Single Marker Component
function SingleMarker({
  unit,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
}: {
  unit: Unit;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  style: React.CSSProperties;
}) {
  const price = formatCurrency(Number(unit.rent_amount));

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        ...style,
        transform: `translate(-50%, -100%) ${
          isSelected ? "scale(1.15)" : isHovered ? "scale(1.1)" : "scale(1)"
        }`,
        transition: `all 0.3s ${SPRING.snappy}`,
        zIndex: isSelected ? 100 : isHovered ? 50 : 10,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`
          relative px-3 py-2 rounded-full font-bold text-sm whitespace-nowrap
          shadow-lg transition-all duration-300
          ${
            isSelected
              ? "bg-emerald-600 text-white shadow-emerald-600/40"
              : isHovered
              ? "bg-slate-900 text-white shadow-slate-900/30"
              : "bg-white text-slate-900 shadow-slate-900/10 border border-slate-200"
          }
        `}
      >
        {price}
        {unit.is_verified && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
            <BadgeCheck className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </div>

      <div
        className={`
          absolute left-1/2 -translate-x-1/2 w-0 h-0
          border-l-[8px] border-r-[8px] border-t-[10px]
          border-l-transparent border-r-transparent
          transition-colors duration-300
          ${
            isSelected
              ? "border-t-emerald-600"
              : isHovered
              ? "border-t-slate-900"
              : "border-t-white"
          }
        `}
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
      />

      {isSelected && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
        </div>
      )}
    </div>
  );
}

// Multi-Property Panel
function MultiPropertyPanel({
  units,
  selectedUnit,
  onSelectUnit,
  onViewDetails,
  onClose,
}: {
  units: Unit[];
  selectedUnit: Unit | null;
  onSelectUnit: (unit: Unit) => void;
  onViewDetails: (unit: Unit) => void;
  onClose: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const lastY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    lastY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientY - lastY.current;
      if (delta > 0) setDragOffset(Math.pow(delta, 0.7));
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragOffset > 80) onClose();
    setDragOffset(0);
  }, [dragOffset, onClose]);

  return (
    <div
      className="bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl overflow-hidden will-change-transform"
      style={{
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging
          ? "none"
          : "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex lg:hidden justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              {units.length} Units at this Location
            </h3>
            <p className="text-sm text-slate-500">Select one to view details</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="max-h-[50vh] lg:max-h-[400px] overflow-y-auto">
        {units.map((unit, index) => {
          const isSelected = selectedUnit?.unit_id === unit.unit_id;
          const images = unit.photos?.length > 0 ? unit.photos : [];

          return (
            <div
              key={unit.unit_id}
              className={`
                relative flex items-center gap-4 p-4 cursor-pointer transition-all
                ${isSelected ? "bg-emerald-50" : "hover:bg-slate-50"}
                ${index !== units.length - 1 ? "border-b border-slate-100" : ""}
              `}
              onClick={() => onSelectUnit(unit)}
            >
              {isSelected && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-r-full" />
              )}

              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                {images[0] ? (
                  <Image
                    src={images[0]}
                    alt={unit.unit_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                {unit.is_verified && (
                  <div className="absolute top-1 left-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <BadgeCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {unit.unit_name}
                </h4>
                <p className="text-sm text-slate-500 truncate mb-1">
                  {unit.property_name}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {unit.unit_size > 0 && (
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      {unit.unit_size} sqm
                    </span>
                  )}
                  {unit.furnish && (
                    <span className="flex items-center gap-1">
                      <Sofa className="w-3 h-3" />
                      {unit.furnish.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <p className="font-bold text-emerald-600">
                  {formatCurrency(Number(unit.rent_amount))}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(unit);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Unit Quick View
function UnitQuickView({
  unit,
  onClose,
  onViewDetails,
}: {
  unit: Unit;
  onClose: () => void;
  onViewDetails: () => void;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const lastY = useRef(0);

  const images = unit.photos?.length > 0 ? unit.photos : [];

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    lastY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientY - lastY.current;
      if (delta > 0) setDragOffset(Math.pow(delta, 0.7));
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragOffset > 80) onClose();
    setDragOffset(0);
  }, [dragOffset, onClose]);

  return (
    <div
      className="bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl overflow-hidden will-change-transform"
      style={{
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging
          ? "none"
          : "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex lg:hidden justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      <div className="relative aspect-[16/10] bg-slate-100">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentImage]}
              alt={unit.unit_name}
              fill
              className="object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImage((i) =>
                      i === 0 ? images.length - 1 : i - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImage((i) => (i + 1) % images.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {images.slice(0, 5).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImage(idx)}
                      className={`rounded-full transition-all ${
                        idx === currentImage
                          ? "w-5 h-1.5 bg-white"
                          : "w-1.5 h-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-slate-300" />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {unit.is_verified && (
          <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span className="truncate">
            {formatLocation(unit.city, unit.province)}
          </span>
        </div>

        <h3 className="font-bold text-lg text-slate-900 mb-1 truncate">
          {unit.unit_name}
        </h3>
        <p className="text-sm text-slate-500 mb-3 truncate">
          {unit.property_name}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
          {unit.unit_size > 0 && (
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4" />
              <span>{unit.unit_size} sqm</span>
            </div>
          )}
          {unit.furnish && (
            <div className="flex items-center gap-1.5">
              <Sofa className="w-4 h-4" />
              <span className="capitalize">
                {unit.furnish.replace(/_/g, " ")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(Number(unit.rent_amount))}
            </p>
            <p className="text-xs text-slate-400">per month</p>
          </div>
          <button
            type="button"
            onClick={onViewDetails}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/20"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// Main MapView Component
export default function MapView({
  units,
  onUnitClick,
  selectedUnitId,
  onSelectUnit,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [center, setCenter] = useState({ lat: 14.5995, lng: 120.9842 });
  const [mapDimensions, setMapDimensions] = useState({
    width: 800,
    height: 600,
  });

  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showMultiPanel, setShowMultiPanel] = useState(false);
  const [multiPanelUnits, setMultiPanelUnits] = useState<Unit[]>([]);

  const markerGroups = useMemo(() => {
    return groupOverlappingMarkers(
      units,
      zoom,
      mapDimensions.width,
      mapDimensions.height,
      center
    );
  }, [units, zoom, mapDimensions, center]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || isMapLoaded) return;
    if (typeof google === "undefined" || !google.maps) {
      console.warn("Google Maps not loaded");
      return;
    }

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 14.5995, lng: 120.9842 },
      zoom: 12,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#e0f2fe" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#f8fafc" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "road.arterial",
          elementType: "geometry",
          stylers: [{ color: "#e2e8f0" }],
        },
      ],
    });

    map.addListener("zoom_changed", () => setZoom(map.getZoom() || 12));
    map.addListener("center_changed", () => {
      const c = map.getCenter();
      if (c) setCenter({ lat: c.lat(), lng: c.lng() });
    });
    map.addListener("click", () => {
      setExpandedGroupId(null);
      setSelectedUnit(null);
      setShowMultiPanel(false);
      onSelectUnit?.(null);
    });

    setMapInstance(map);
    setIsMapLoaded(true);

    const unitsWithCoords = units.filter((u) => u.latitude && u.longitude);
    if (unitsWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      unitsWithCoords.forEach((u) => {
        bounds.extend({ lat: Number(u.latitude), lng: Number(u.longitude) });
      });
      map.fitBounds(bounds, 50);
    }
  }, [units, isMapLoaded, onSelectUnit]);

  // Track map dimensions
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setMapDimensions({ width, height });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const getPixelPosition = useCallback(
    (lat: number, lng: number) => {
      if (!mapRef.current) return { x: -1000, y: -1000 };
      const scale = Math.pow(2, zoom);
      const worldCoord = project({ lat, lng });
      const centerWorldCoord = project(center);
      return {
        x:
          (worldCoord.x - centerWorldCoord.x) * scale + mapDimensions.width / 2,
        y:
          (worldCoord.y - centerWorldCoord.y) * scale +
          mapDimensions.height / 2,
      };
    },
    [zoom, center, mapDimensions]
  );

  const handleGroupClick = useCallback(
    (group: MarkerGroup) => {
      if (group.units.length === 1) {
        setSelectedUnit(group.units[0]);
        setShowMultiPanel(false);
        onSelectUnit?.(group.units[0]);
        if (mapInstance) mapInstance.panTo({ lat: group.lat, lng: group.lng });
      } else if (group.units.length <= CLUSTER_CONFIG.maxSpiderfyItems) {
        if (expandedGroupId === group.id) {
          setExpandedGroupId(null);
        } else {
          setExpandedGroupId(group.id);
          setSelectedUnit(null);
          setShowMultiPanel(false);
        }
        if (mapInstance) mapInstance.panTo({ lat: group.lat, lng: group.lng });
      } else {
        setMultiPanelUnits(group.units);
        setShowMultiPanel(true);
        setExpandedGroupId(null);
        if (mapInstance) mapInstance.panTo({ lat: group.lat, lng: group.lng });
      }
    },
    [expandedGroupId, mapInstance, onSelectUnit]
  );

  const handleUnitSelect = useCallback(
    (unit: Unit) => {
      setSelectedUnit(unit);
      onSelectUnit?.(unit);
    },
    [onSelectUnit]
  );

  const handleZoomIn = useCallback(() => {
    mapInstance?.setZoom((mapInstance.getZoom() || 12) + 1);
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    mapInstance?.setZoom((mapInstance.getZoom() || 12) - 1);
  }, [mapInstance]);

  const handleRecenter = useCallback(() => {
    if (!mapInstance) return;
    const unitsWithCoords = units.filter((u) => u.latitude && u.longitude);
    if (unitsWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      unitsWithCoords.forEach((u) => {
        bounds.extend({ lat: Number(u.latitude), lng: Number(u.longitude) });
      });
      mapInstance.fitBounds(bounds, 50);
    }
  }, [mapInstance, units]);

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />

      {isMapLoaded && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {markerGroups.map((group) => {
            const pos = getPixelPosition(group.lat, group.lng);
            const isExpanded = expandedGroupId === group.id;
            const isHovered = hoveredGroupId === group.id;

            if (
              pos.x < -100 ||
              pos.y < -100 ||
              pos.x > mapDimensions.width + 100 ||
              pos.y > mapDimensions.height + 100
            ) {
              return null;
            }

            if (isExpanded && group.units.length > 1) {
              const spiderfyPositions = getSpiderfyPositions(
                group.units.length,
                pos.x,
                pos.y
              );

              return (
                <div key={group.id} className="pointer-events-auto">
                  <ClusterMarker
                    group={group}
                    isSelected={false}
                    isHovered={false}
                    isExpanded={true}
                    onClick={() => setExpandedGroupId(null)}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    style={{ left: pos.x, top: pos.y }}
                  />
                  {group.units.map((unit, idx) => {
                    const spiderPos = spiderfyPositions[idx];
                    if (!spiderPos) return null;
                    return (
                      <SingleMarker
                        key={unit.unit_id}
                        unit={unit}
                        isSelected={selectedUnit?.unit_id === unit.unit_id}
                        isHovered={false}
                        onClick={() => handleUnitSelect(unit)}
                        onMouseEnter={() => {}}
                        onMouseLeave={() => {}}
                        style={{ left: spiderPos.x, top: spiderPos.y }}
                      />
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={group.id} className="pointer-events-auto">
                <ClusterMarker
                  group={group}
                  isSelected={
                    group.units.length === 1 &&
                    selectedUnit?.unit_id === group.units[0].unit_id
                  }
                  isHovered={isHovered}
                  isExpanded={false}
                  onClick={() => handleGroupClick(group)}
                  onMouseEnter={() => setHoveredGroupId(group.id)}
                  onMouseLeave={() => setHoveredGroupId(null)}
                  style={{ left: pos.x, top: pos.y }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Minus className="w-5 h-5 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Navigation className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Property Count */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
        <span className="text-sm font-semibold text-slate-700">
          <span className="text-emerald-600">
            {units.filter((u) => u.latitude && u.longitude).length}
          </span>{" "}
          on map
        </span>
      </div>

      {/* Single Unit Quick View */}
      {selectedUnit && !showMultiPanel && (
        <div className="absolute inset-x-0 bottom-0 lg:left-4 lg:right-auto lg:bottom-4 lg:w-[380px]">
          <UnitQuickView
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

      {/* Multi-Property Panel */}
      {showMultiPanel && multiPanelUnits.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 lg:left-4 lg:right-auto lg:bottom-4 lg:w-[420px]">
          <MultiPropertyPanel
            units={multiPanelUnits}
            selectedUnit={selectedUnit}
            onSelectUnit={handleUnitSelect}
            onViewDetails={(unit) =>
              onUnitClick(unit.unit_id, unit.property_id)
            }
            onClose={() => {
              setShowMultiPanel(false);
              setSelectedUnit(null);
              onSelectUnit?.(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
