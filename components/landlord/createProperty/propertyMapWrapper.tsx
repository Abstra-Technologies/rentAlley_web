"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react";

// Custom SVG marker icon (solves the missing marker issue in Next.js)
const customIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 28 20 28s20-14 20-28C40 8.954 31.046 0 20 0z" fill="#3B82F6"/>
      <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 28 20 28s20-14 20-28C40 8.954 31.046 0 20 0z" fill="url(#gradient)"/>
      <circle cx="20" cy="18" r="8" fill="white"/>
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="48" gradientUnits="userSpaceOnUse">
          <stop stop-color="#3B82F6"/>
          <stop offset="1" stop-color="#10B981"/>
        </linearGradient>
      </defs>
    </svg>
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48],
});

interface Props {
  coordinates: [number, number] | null;
  setFields: (fields: {
    latitude: number;
    longitude: number;
    street: string;
    brgyDistrict: string;
    city: string;
    province: string;
    zipCode: string;
  }) => void;
}

// Component to handle map center changes
function MapController({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 17, { duration: 1.5 });
    }
  }, [center, zoom, map]);

  return null;
}

// Component to handle map clicks
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to reposition zoom controls
function ZoomControlPosition() {
  const map = useMap();

  useEffect(() => {
    // Move zoom control to bottom right
    map.zoomControl.setPosition("bottomright");
  }, [map]);

  return null;
}

export default function PropertyMapWrapper({ coordinates, setFields }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(
    coordinates,
  );
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    coordinates,
  );
  const [successMessage, setSuccessMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Default center (Philippines)
  const defaultCenter: [number, number] = [14.5995, 120.9842];

  // Sync marker with coordinates prop
  useEffect(() => {
    if (coordinates) {
      setMarkerPosition(coordinates);
      setMapCenter(coordinates);
    }
  }, [coordinates]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value,
          )}&addressdetails=1&countrycodes=ph&limit=5`,
        );
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Reverse geocode (coordinates to address)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      );
      const data = await res.json();

      if (data?.address) {
        const addr = data.address;
        setFields({
          latitude: lat,
          longitude: lng,
          street: addr.road || addr.pedestrian || addr.neighbourhood || "",
          brgyDistrict: addr.suburb || addr.village || addr.neighbourhood || "",
          city: addr.city || addr.town || addr.municipality || "",
          province: addr.state || addr.region || "",
          zipCode: addr.postcode || "",
        });

        setSearchQuery(
          addr.road ||
            addr.pedestrian ||
            data.display_name?.split(",")[0] ||
            "",
        );
        showSuccess("Location updated!");
      }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  // Handle address selection
  const handleSelectAddress = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const addr = place.address || {};

    const newPosition: [number, number] = [lat, lng];
    setMapCenter(newPosition);
    setMarkerPosition(newPosition);

    setFields({
      latitude: lat,
      longitude: lng,
      street:
        addr.road || addr.pedestrian || place.display_name?.split(",")[0] || "",
      brgyDistrict: addr.suburb || addr.village || addr.neighbourhood || "",
      city: addr.city || addr.town || addr.municipality || "",
      province: addr.state || addr.region || "",
      zipCode: addr.postcode || "",
    });

    setSearchQuery(
      addr.road || addr.pedestrian || place.display_name?.split(",")[0] || "",
    );
    setShowResults(false);
    setSearchResults([]);
    showSuccess("Address selected!");
  };

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setMapCenter(newPosition);
    setMarkerPosition(newPosition);
    reverseGeocode(lat, lng);
  };

  // Use current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition: [number, number] = [latitude, longitude];
        setMapCenter(newPosition);
        setMarkerPosition(newPosition);
        await reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enable location services.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    searchRef.current?.focus();
  };

  return (
    <div className="relative w-full h-full">
      {/* Custom styles for marker and controls */}
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          border-radius: 12px !important;
          overflow: hidden;
          margin-right: 12px !important;
          margin-bottom: 12px !important;
        }
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
          color: #374151 !important;
          border: none !important;
          background: white !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
        }
        .leaflet-control-zoom-in {
          border-bottom: 1px solid #e5e7eb !important;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255, 255, 255, 0.9) !important;
          padding: 2px 8px !important;
          border-radius: 4px 0 0 0 !important;
        }
      `}</style>

      {/* Search Bar Overlay - Constrained width */}
      <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
        <div className="max-w-sm pointer-events-auto">
          {/* Search Input Container */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center">
              {/* Search Icon */}
              <div className="pl-3 sm:pl-4">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                )}
              </div>

              {/* Input */}
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search address..."
                className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 text-sm bg-transparent outline-none placeholder-gray-400 min-w-0"
              />

              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Divider */}
              <div className="w-px h-6 sm:h-8 bg-gray-200"></div>

              {/* Location Button */}
              <button
                onClick={handleUseMyLocation}
                disabled={isLocating}
                title="Use my location"
                className="p-2.5 sm:p-3 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div
              ref={resultsRef}
              className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
            >
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAddress(result)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-2 sm:gap-3"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {result.address?.road ||
                        result.address?.pedestrian ||
                        result.display_name?.split(",")[0]}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate mt-0.5">
                      {result.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {showResults &&
            searchQuery.length >= 3 &&
            !isSearching &&
            searchResults.length === 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500">
                  No addresses found
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                  Try a different search or click on the map
                </p>
              </div>
            )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500 text-white rounded-full shadow-lg text-xs sm:text-sm font-medium">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {successMessage}
          </div>
        </div>
      )}

      {/* Map Hint - Bottom Left */}
      <div className="absolute bottom-3 left-3 z-[999]">
        <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-md text-[10px] sm:text-xs text-gray-600 flex items-center gap-1.5 sm:gap-2 border border-gray-200">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
          </div>
          <span>Click to set location</span>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={coordinates || defaultCenter}
        zoom={coordinates ? 17 : 6}
        className="w-full h-full rounded-xl"
        style={{ zIndex: 1 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} />
        <MapClickHandler onMapClick={handleMapClick} />
        <ZoomControlPosition />

        {markerPosition && (
          <Marker position={markerPosition} icon={customIcon} />
        )}
      </MapContainer>
    </div>
  );
}
