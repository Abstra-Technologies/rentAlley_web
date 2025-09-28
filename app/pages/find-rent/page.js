"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiBadgeCheck } from "react-icons/hi";
import {
  FaSearch,
  FaChevronDown,
  FaMapMarkerAlt,
  FaSpinner,
  FaMap,
  FaEye,
  FaTimes,
  FaFilter,
  FaList,
  FaBed,
  FaBath,
  FaCar,
  FaHome,
  FaRuler,
  FaCouch,
  FaChevronLeft,
  FaChevronRight,
  FaBuilding,
  FaUsers,
  FaShieldAlt,
  FaBars,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import { BsImageAlt, BsGridFill } from "react-icons/bs";
import { MdVerified, MdClose, MdApartment, MdFilterList } from "react-icons/md";
import { HiOutlineAdjustments } from "react-icons/hi";
import Swal from "sweetalert2";
import axios from "axios";
import { logEvent } from "../../../utils/gtag";
import LoadingScreen from "@/components/loadingScreen";

// Sanitize helper function for XSS protection
const sanitizeInput = (str) => {
  if (!str) return "";
  return str.replace(/[<>]/g, "");
};

// Dynamic imports for map components
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

import { useMap } from "react-leaflet";

// Map utility components
function FlyToUserLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 13);
    }
  }, [coords, map]);
  return null;
}

function FlyToProperty({ coords, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], zoom);
    }
  }, [coords, map, zoom]);
  return null;
}

// Enhanced Mobile-First Search Header
function MobileSearchHeader({
  searchQuery,
  setSearchQuery,
  propertyTypeFilter,
  setPropertyTypeFilter,
  viewMode,
  setViewMode,
  filteredProperties,
  showMobileFilters,
  setShowMobileFilters,
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const propertyTypes = [
    { label: "All Types", value: "" },
    { label: "Apartment", value: "apartment" },
    { label: "Duplex", value: "duplex" },
    { label: "Condo", value: "condo" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="px-3 py-2 sm:px-6 sm:py-4">
        {/* Mobile-optimized search and controls */}
        <div className="flex items-center gap-2 mb-3 sm:mb-0">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-emerald-500 focus:outline-none text-sm bg-gray-50 focus:bg-white transition-all"
              aria-label="Search properties"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden p-2.5 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
            aria-label="Toggle filters"
          >
            <MdFilterList className="text-emerald-600 text-lg" />
          </button>
        </div>

        {/* Desktop Controls Row */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Property Type Filter */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-transparent hover:border-emerald-200 rounded-xl transition-all group"
              >
                <HiOutlineAdjustments className="text-emerald-600 group-hover:rotate-90 transition-transform" />
                <span className="font-medium text-gray-700">
                  {propertyTypeFilter
                    ? propertyTypes.find((t) => t.value === propertyTypeFilter)
                        ?.label
                    : "All Types"}
                </span>
                <FaChevronDown
                  className={`text-xs text-emerald-600 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setPropertyTypeFilter(type.value);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-colors ${
                        propertyTypeFilter === type.value
                          ? "bg-gradient-to-r from-blue-100 to-emerald-100 text-emerald-700 font-medium"
                          : ""
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results count */}
            <div>
              <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                {filteredProperties.length}
              </span>
              <span className="text-sm text-gray-600 ml-1">properties</span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gradient-to-r from-blue-100 to-emerald-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BsGridFill className="inline mr-2 text-blue-600" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaList className="inline mr-2 text-emerald-600" />
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "map"
                  ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaMap className="inline mr-2 text-teal-600" />
              Map
            </button>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="lg:hidden mt-3 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-emerald-200">
            {/* Property Type Filter for Mobile */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setPropertyTypeFilter(type.value)}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      propertyTypeFilter === type.value
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-emerald-100"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* View Toggle for Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="flex gap-1 bg-white rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <BsGridFill className="inline mr-1" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FaList className="inline mr-1" />
                  List
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    viewMode === "map"
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FaMap className="inline mr-1" />
                  Map
                </button>
              </div>
            </div>

            {/* Results count for mobile */}
            <div className="mt-3 text-center">
              <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                {filteredProperties.length} properties found
              </span>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(searchQuery || propertyTypeFilter) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {searchQuery && (
              <span className="inline-flex items-center bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs">
                <FaSearch className="mr-1 text-xs" />"{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            )}
            {propertyTypeFilter && (
              <span className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs">
                <FaBuilding className="mr-1 text-xs" />
                {
                  propertyTypes.find((t) => t.value === propertyTypeFilter)
                    ?.label
                }
                <button
                  onClick={() => setPropertyTypeFilter("")}
                  className="ml-2 text-emerald-600 hover:text-emerald-800"
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile-Optimized Map Controls
function MapControls({
  sidebarOpen,
  setSidebarOpen,
  filteredProperties,
  isFullscreen,
  setIsFullscreen,
}) {
  return (
    <>
      {/* Mobile Map Controls - Fixed Position */}
      <div className="lg:hidden fixed top-20 left-4 right-4 z-30 flex justify-between items-center">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-lg hover:shadow-xl transition-all text-sm font-medium flex items-center gap-2"
        >
          <FaList className="text-emerald-600" />
          <span>
            {sidebarOpen ? "Hide" : "Show"} List ({filteredProperties.length})
          </span>
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-white border border-gray-300 rounded-xl p-2 shadow-lg hover:shadow-xl transition-all"
        >
          {isFullscreen ? (
            <FaCompress className="text-gray-600" />
          ) : (
            <FaExpand className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Desktop Map Controls */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden lg:block absolute top-4 left-4 z-10 bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-lg hover:shadow-xl transition-all"
        >
          <FaList className="text-emerald-600 mr-2 inline" />
          <span className="text-sm font-semibold">
            Show List ({filteredProperties.length})
          </span>
        </button>
      )}
    </>
  );
}

// Mobile-First Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 1; i <= Math.min(3, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > 3) {
          pages.push("...");
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 1) {
        pages.push(1);
        if (totalPages > 3) pages.push("...");
        for (let i = Math.max(totalPages - 2, 1); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        <span className="font-semibold text-blue-700">{startItem}</span>-
        <span className="font-semibold text-blue-700">{endItem}</span> of{" "}
        <span className="font-semibold text-emerald-700">{totalItems}</span>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1 order-1 sm:order-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>

          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span
                key={index}
                className="px-2 sm:px-3 py-2 text-sm text-gray-500"
              >
                ...
              </span>
            ) : (
              <button
                key={index}
                onClick={() => onPageChange(page)}
                className={`px-2 sm:px-3 py-2 text-sm font-medium border transition-all ${
                  currentPage === page
                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-transparent"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-blue-50"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </nav>
      )}
    </div>
  );
}

// Property type utilities
const propertyTypeLabels = {
  apartment: "Apartment",
  office_space: "Office Space",
  duplex: "Duplex",
  house: "House",
  warehouse: "Warehouse",
  dormitory: "Dormitory",
};

function formatPropertyType(type) {
  return propertyTypeLabels[type] || type;
}

function PropertyTypeBadge({ type }) {
  const typeConfig = {
    apartment: { icon: MdApartment, bg: "bg-blue-100", text: "text-blue-700" },
    duplex: { icon: FaHome, bg: "bg-emerald-100", text: "text-emerald-700" },
    condo: { icon: FaBuilding, bg: "bg-teal-100", text: "text-teal-700" },
    house: { icon: FaHome, bg: "bg-rose-100", text: "text-rose-700" },
    warehouse: { icon: FaBuilding, bg: "bg-amber-100", text: "text-amber-700" },
    dormitory: { icon: FaUsers, bg: "bg-indigo-100", text: "text-indigo-700" },
    office_space: {
      icon: FaBuilding,
      bg: "bg-purple-100",
      text: "text-purple-700",
    },
    default: { icon: FaHome, bg: "bg-gray-100", text: "text-gray-700" },
  };

  const config = typeConfig[type?.toLowerCase()] || typeConfig.default;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 ${config.bg} ${config.text} text-xs rounded-full`}
    >
      <Icon className="w-3 h-3" />
      <span>{formatPropertyType(type)}</span>
    </span>
  );
}

// Main Component
export default function PropertySearch() {
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPropertyUnits, setSelectedPropertyUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [visibleMaps, setVisibleMaps] = useState({});
  const [markerIcon, setMarkerIcon] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredProperty, setHoveredProperty] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Map specific states
  const [userCoords, setUserCoords] = useState(null);
  const [userIcon, setUserIcon] = useState(null);
  const [propertyIcon, setPropertyIcon] = useState(null);

  // Auto-hide mobile sidebar when switching from map view
  useEffect(() => {
    if (viewMode !== "map") {
      setShowMobileFilters(false);
    }
  }, [viewMode]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, paginatedProperties };
  }, [filteredProperties, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, propertyTypeFilter]);

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      if (viewMode !== "map") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [viewMode]
  );

  // Fetch properties with error handling
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (searchQuery) params.append("searchQuery", searchQuery);
        if (propertyTypeFilter)
          params.append("propertyType", propertyTypeFilter);

        const res = await fetch(
          `/api/properties/findRent?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch properties: ${res.status}`);
        }

        const data = await res.json();
        const sanitizedData = data.map((property) => ({
          ...property,
          property_name: sanitizeInput(property.property_name),
          city: sanitizeInput(property.city),
          province: sanitizeInput(property.province),
          street: sanitizeInput(property.street),
        }));

        setAllProperties(sanitizedData);
        setFilteredProperties(sanitizedData);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError("Unable to load properties. Please try again later.");
        logEvent({
          action: "error",
          params: {
            error_type: "fetch_properties",
            error_message: error.message,
          },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [searchQuery, propertyTypeFilter]);

  // Initialize map icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/marker.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const userLocationIcon = new L.Icon({
        iconUrl: "/upkeep_blue_marker.png",
        iconSize: [45, 45],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: "animate-pulse",
      });
      setUserIcon(userLocationIcon);

      const propIcon = new L.Icon({
        iconUrl: "/marker.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
      setPropertyIcon(propIcon);
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (error) => {
          console.log("Location permission denied or unavailable");
          logEvent({
            action: "location_permission_denied",
            params: { error: error.message },
          });
        }
      );
    }
  }, []);

  const handleToggleMap = useCallback((e, propertyId) => {
    e.stopPropagation();
    setVisibleMaps((prev) => ({
      ...prev,
      [propertyId]: !prev[propertyId],
    }));
  }, []);

  const handleViewDetails = useCallback(
    (propertyId) => {
      logEvent({
        action: "view_property_details",
        params: { property_id: propertyId },
      });

      Swal.fire({
        title: "Loading...",
        text: "Redirecting to property details...",
        allowOutsideClick: true,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      setTimeout(() => {
        Swal.close();
        router.push(`/pages/find-rent/${propertyId}`);
      }, 1500);
    },
    [router]
  );

  const handlePropertyClick = useCallback(async (property) => {
    try {
      setLoadingUnits(true);
      setSelectedProperty(property);

      const response = await axios.get(
        `/api/properties/findRent/viewPropertyDetails?id=${property.property_id}`,
        { timeout: 10000, headers: { "Content-Type": "application/json" } }
      );

      setSelectedPropertyUnits(response.data.units || []);
    } catch (error) {
      console.error("Failed to fetch property units:", error);
      setSelectedPropertyUnits([]);
      Swal.fire({
        icon: "error",
        title: "Unable to load units",
        text: "Please try again later",
        timer: 2000,
      });
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const handleSidebarPropertyClick = useCallback(
    async (property) => {
      if (property.latitude && property.longitude) {
        setMapCenter({
          lat: parseFloat(property.latitude),
          lng: parseFloat(property.longitude),
        });
      }
      await handlePropertyClick(property);
    },
    [handlePropertyClick]
  );

  const handleViewUnitDetails = useCallback(
    (unitId) => {
      logEvent({
        action: "view_unit_details",
        params: { property_id: selectedProperty.property_id, unit_id: unitId },
      });

      router.push(`/pages/find-rent/${selectedProperty.property_id}/${unitId}`);
    },
    [selectedProperty, router]
  );

  const handleViewPropertyDetails = useCallback(() => {
    router.push(`/pages/find-rent/${selectedProperty.property_id}`);
  }, [selectedProperty, router]);

  // URL parameter handling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get("searchQuery");
      if (queryParam) {
        setSearchQuery(sanitizeInput(queryParam));
      }
    }
  }, []);

  // Memoized filtering logic
  const filterProperties = useMemo(() => {
    return allProperties.filter((property) => {
      const sanitizedSearchQuery = sanitizeInput(searchQuery);

      const matchesSearch =
        !sanitizedSearchQuery ||
        property.property_name
          ?.toLowerCase()
          .includes(sanitizedSearchQuery.toLowerCase()) ||
        property.city
          ?.toLowerCase()
          .includes(sanitizedSearchQuery.toLowerCase()) ||
        property.province
          ?.toLowerCase()
          .includes(sanitizedSearchQuery.toLowerCase()) ||
        property.street
          ?.toLowerCase()
          .includes(sanitizedSearchQuery.toLowerCase());

      const matchesType =
        !propertyTypeFilter ||
        property.property_type?.toLowerCase() ===
          propertyTypeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [searchQuery, propertyTypeFilter, allProperties]);

  useEffect(() => {
    setFilteredProperties(filterProperties);
  }, [filterProperties]);

  const defaultCenter = userCoords || { lat: 14.5995, lng: 120.9842 };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
        <LoadingScreen message="Finding perfect properties for you..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <FaShieldAlt className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        isFullscreen && viewMode === "map"
          ? "fixed inset-0 z-50 bg-white"
          : "h-screen"
      } flex flex-col bg-gradient-to-br from-blue-50 via-white to-emerald-50`}
    >
      {/* Mobile-First Search Header */}
      <MobileSearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        propertyTypeFilter={propertyTypeFilter}
        setPropertyTypeFilter={setPropertyTypeFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filteredProperties={filteredProperties}
        showMobileFilters={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex relative" role="main">
        {viewMode === "grid" ? (
          /* Enhanced Grid View */
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {filteredProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="relative mb-4">
                    <FaSearch className="text-gray-300 text-5xl" />
                    <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
                    No properties found
                  </h3>
                  <p className="text-gray-500 mb-4 text-sm sm:text-base max-w-md">
                    Try adjusting your search criteria or explore all available
                    properties
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setPropertyTypeFilter("");
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-medium"
                  >
                    View All Properties
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {paginationData.paginatedProperties.map((property) => (
                    <article
                      key={property.property_id}
                      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                    >
                      {/* Property Image */}
                      <div className="relative">
                        {property?.property_photo ? (
                          <div className="relative h-48 sm:h-56 overflow-hidden">
                            <Image
                              src={property?.property_photo}
                              alt={property?.property_name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ) : (
                          <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
                            <BsImageAlt className="text-4xl text-gray-400" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <PropertyTypeBadge type={property?.property_type} />
                        </div>

                        {property?.flexipay_enabled === 1 && (
                          <div className="absolute top-3 right-3">
                            <div className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full shadow-md">
                              FlexiPay ✓
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Property Details */}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-gray-900 text-lg line-clamp-1 flex-1">
                            {property?.property_name}
                          </h3>
                          <MdVerified className="text-blue-500 text-lg flex-shrink-0 ml-2" />
                        </div>

                        <div className="flex items-center text-gray-600 mb-3">
                          <FaMapMarkerAlt className="mr-1.5 text-emerald-500 flex-shrink-0" />
                          <p className="text-sm truncate">
                            {property?.city},{" "}
                            {property?.province
                              ?.split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <FaUsers className="text-blue-500 text-sm" />
                            <span className="text-xs text-gray-600">
                              Multiple units available
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleViewDetails(property.property_id)
                          }
                          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
                        >
                          View Property & Units
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {filteredProperties.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={paginationData.totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredProperties.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        ) : viewMode === "list" ? (
          /* Enhanced List View */
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
              {filteredProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FaSearch className="text-gray-300 text-5xl mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    No properties found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search criteria
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setPropertyTypeFilter("");
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginationData.paginatedProperties.map((property) => (
                    <article
                      key={property.property_id}
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Property Image */}
                        <div className="relative sm:w-64 h-48 sm:h-auto">
                          {property?.property_photo ? (
                            <Image
                              src={property?.property_photo}
                              alt={property?.property_name}
                              fill
                              sizes="(max-width: 640px) 100vw, 256px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
                              <BsImageAlt className="text-4xl text-gray-400" />
                            </div>
                          )}

                          <div className="absolute top-3 left-3">
                            <PropertyTypeBadge type={property?.property_type} />
                          </div>

                          {property?.flexipay_enabled === 1 && (
                            <div className="absolute top-3 right-3">
                              <div className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full shadow-md">
                                FlexiPay ✓
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Property Details */}
                        <div className="flex-1 p-4 sm:p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-xl text-gray-900">
                                  {property?.property_name}
                                </h3>
                                <MdVerified className="text-blue-500 text-lg" />
                              </div>

                              <div className="flex items-center text-gray-600 mb-3">
                                <FaMapMarkerAlt className="mr-1.5 text-emerald-500" />
                                <p className="text-sm">
                                  {property?.street}, {property?.city},{" "}
                                  {property?.province
                                    ?.split("_")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-3 mb-4">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <FaBuilding className="text-blue-500" />
                                  <span className="capitalize">
                                    {property?.property_type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <FaUsers className="text-emerald-500" />
                                  <span>Multiple units</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleViewDetails(property.property_id)
                              }
                              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
                            >
                              View Property & Units
                            </button>
                            <button
                              onClick={(e) =>
                                handleToggleMap(e, property.property_id)
                              }
                              className="px-4 py-2.5 bg-white border-2 border-emerald-500 text-emerald-600 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-colors"
                            >
                              <FaMap />
                            </button>
                          </div>

                          {/* Inline Map */}
                          {visibleMaps[property.property_id] && (
                            <div className="mt-4 rounded-xl overflow-hidden border-2 border-emerald-200">
                              {property.latitude && property.longitude ? (
                                <div className="h-48">
                                  <MapContainer
                                    key={`map-${property.property_id}`}
                                    center={[
                                      parseFloat(property.latitude),
                                      parseFloat(property.longitude),
                                    ]}
                                    zoom={15}
                                    style={{ height: "100%", width: "100%" }}
                                  >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker
                                      position={[
                                        parseFloat(property.latitude),
                                        parseFloat(property.longitude),
                                      ]}
                                      icon={propertyIcon}
                                    >
                                      <Popup>
                                        <div className="text-center p-2">
                                          <strong>
                                            {property.property_name}
                                          </strong>
                                        </div>
                                      </Popup>
                                    </Marker>
                                  </MapContainer>
                                </div>
                              ) : (
                                <div className="h-32 bg-gray-100 flex items-center justify-center">
                                  <p className="text-red-500 text-sm">
                                    Location not available
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {filteredProperties.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={paginationData.totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredProperties.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        ) : (
          /* Enhanced Mobile-First Map View */
          <>
            {/* Mobile-Optimized Sidebar */}
            <aside
              className={`bg-white border-r border-gray-200 transition-all duration-300 ${
                sidebarOpen
                  ? "w-full sm:w-96 absolute sm:static inset-0 z-20 sm:z-auto"
                  : "w-0 sm:w-0"
              } overflow-hidden`}
            >
              <div className="h-full flex flex-col">
                {/* Mobile-optimized header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                        Properties ({filteredProperties.length})
                      </h2>
                      <p className="text-xs text-gray-600 sm:hidden">
                        Tap any property to view on map
                      </p>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      aria-label="Close sidebar"
                    >
                      <MdClose className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-auto">
                    {filteredProperties.length === 0 ? (
                      <div className="p-4 text-center">
                        <FaSearch className="text-gray-300 text-3xl mx-auto mb-3" />
                        <p className="text-gray-500">No properties found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {paginationData.paginatedProperties.map((property) => (
                          <div
                            key={property.property_id}
                            className={`p-3 sm:p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 cursor-pointer transition-all active:bg-emerald-100 ${
                              hoveredProperty === property.property_id
                                ? "bg-gradient-to-r from-blue-50 to-emerald-50"
                                : ""
                            }`}
                            onMouseEnter={() =>
                              setHoveredProperty(property.property_id)
                            }
                            onMouseLeave={() => setHoveredProperty(null)}
                            onClick={() => {
                              handleSidebarPropertyClick(property);
                              // Auto-hide sidebar on mobile after selection
                              if (window.innerWidth < 640) {
                                setTimeout(() => setSidebarOpen(false), 300);
                              }
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {property?.property_photo ? (
                                  <Image
                                    src={property?.property_photo}
                                    alt={property?.property_name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BsImageAlt className="text-gray-400 text-sm" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="font-bold text-gray-900 line-clamp-2 text-sm sm:text-base">
                                    {property?.property_name}
                                  </h3>
                                  {property?.flexipay_enabled === 1 && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 text-xs rounded-full flex-shrink-0 ml-2">
                                      FlexiPay
                                    </span>
                                  )}
                                </div>

                                <div className="mb-2">
                                  <PropertyTypeBadge
                                    type={property?.property_type}
                                  />
                                </div>

                                <div className="flex items-center text-gray-500 text-xs mb-3">
                                  <FaMapMarkerAlt className="mr-1 text-emerald-500 flex-shrink-0" />
                                  <span className="truncate">
                                    {property?.city},{" "}
                                    {property?.province
                                      ?.split("_")
                                      .map(
                                        (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1)
                                      )
                                      .join(" ")}
                                  </span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(property.property_id);
                                  }}
                                  className="w-full py-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile-optimized pagination */}
                  {filteredProperties.length > 0 && (
                    <div className="border-t border-gray-200">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={paginationData.totalPages}
                        onPageChange={handlePageChange}
                        totalItems={filteredProperties.length}
                        itemsPerPage={itemsPerPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Map Container with Mobile Controls */}
            <div className="flex-1 relative">
              <MapControls
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                filteredProperties={filteredProperties}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
              />

              {/* Enhanced Mobile Map Legend */}
              <div className="absolute top-16 sm:top-4 right-4 bg-white rounded-xl shadow-lg p-3 sm:p-4 z-20 max-w-[160px] sm:max-w-[180px]">
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-xs sm:text-sm">
                  Map Legend
                </h3>
                <div className="space-y-1 sm:space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="text-xs">Your Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500 text-xs flex-shrink-0" />
                    <span className="text-xs">Properties</span>
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Tap markers to view units
                  </p>
                </div>
              </div>

              {/* Leaflet Map */}
              <div className="h-full w-full relative z-0">
                <MapContainer
                  center={defaultCenter}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {mapCenter && <FlyToProperty coords={mapCenter} />}

                  {userCoords && userIcon && (
                    <Marker
                      position={[userCoords.lat, userCoords.lng]}
                      icon={userIcon}
                    >
                      <Popup>
                        <div className="text-center p-2">
                          <strong>📍 You are here</strong>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {filteredProperties
                    .filter(
                      (property) =>
                        !isNaN(parseFloat(property.latitude)) &&
                        !isNaN(parseFloat(property.longitude))
                    )
                    .map((property) => (
                      <Marker
                        key={property.property_id}
                        position={[
                          parseFloat(property.latitude),
                          parseFloat(property.longitude),
                        ]}
                        icon={propertyIcon}
                        eventHandlers={{
                          click: () => handlePropertyClick(property),
                        }}
                      >
                        <Popup>
                          <div className="w-60 sm:w-64 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-800 text-sm">
                                {property.property_name}
                              </h3>
                              <MdVerified className="text-blue-500 ml-2 flex-shrink-0" />
                            </div>

                            <PropertyTypeBadge type={property?.property_type} />

                            <p className="text-sm text-gray-600 mt-2 mb-3 line-clamp-2">
                              {property.street}, {property.city},{" "}
                              {property.province}
                            </p>

                            <button
                              onClick={() => handlePropertyClick(property)}
                              className="w-full py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
                            >
                              View Units
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                  <FlyToUserLocation coords={userCoords} />
                </MapContainer>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Enhanced Property Details Sidebar for Map View */}
      {viewMode === "map" && selectedProperty && (
        <aside className="fixed top-16 sm:top-20 right-4 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-5rem)] bg-white shadow-2xl z-[1000] overflow-y-auto border border-gray-200 rounded-2xl">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 sticky top-0 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                  <span className="truncate">
                    {selectedProperty.property_name}
                  </span>
                  <MdVerified className="text-blue-500 ml-2 flex-shrink-0" />
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {selectedProperty.city}, {selectedProperty.province}
                </p>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-500 hover:text-gray-700 p-2 ml-2 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Close details"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {/* Property Image */}
            {selectedProperty.property_photo ? (
              <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden mb-4">
                <Image
                  src={selectedProperty.property_photo}
                  alt={selectedProperty.property_name}
                  fill
                  sizes="(max-width: 640px) calc(100vw - 3rem), 384px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <BsImageAlt className="text-4xl text-gray-400" />
              </div>
            )}

            {/* Property Info */}
            <div className="mb-4 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2">
                <FaHome className="text-blue-500 flex-shrink-0" />
                <span className="font-medium text-sm">Property Type:</span>
                <span className="text-gray-600 capitalize text-sm">
                  {selectedProperty.property_type}
                </span>
              </div>

              {selectedProperty.flexipay_enabled === 1 && (
                <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 text-xs rounded-full">
                  <span>FlexiPay Available</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            <button
              onClick={handleViewPropertyDetails}
              className="w-full py-2.5 mb-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl hover:shadow-md transition-all font-semibold text-sm"
            >
              View Full Property Details
            </button>

            {/* Units List */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center text-sm sm:text-base">
                <MdApartment className="mr-2 text-emerald-500" />
                Available Units
              </h3>

              {loadingUnits ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                </div>
              ) : selectedPropertyUnits.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm bg-gray-50 rounded-xl">
                  No units available
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedPropertyUnits.map((unit) => {
                    const isOccupied = unit.status === "occupied";
                    return (
                      <div
                        key={unit.unit_id}
                        className={`border-2 rounded-xl p-3 transition-all ${
                          isOccupied
                            ? "border-red-200 bg-red-50/50"
                            : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 text-sm">
                            Unit {unit.unit_name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              isOccupied
                                ? "bg-red-100 text-red-700"
                                : "bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isOccupied ? "Occupied" : "Available"}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <FaRuler className="text-gray-400 flex-shrink-0" />
                            <span>{unit.unit_size} sqm</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCouch className="text-gray-400 flex-shrink-0" />
                            <span className="capitalize">
                              {unit.furnish.replace(/_/g, " ")}
                            </span>
                          </div>
                          {unit.bed_spacing !== 0 && (
                            <div className="flex items-center gap-2">
                              <FaBed className="text-gray-400 flex-shrink-0" />
                              <span>{unit.avail_beds} beds available</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 text-sm sm:text-base">
                            ₱{unit.rent_amount.toLocaleString()}/month
                          </span>
                          <button
                            onClick={() => handleViewUnitDetails(unit.unit_id)}
                            className={`px-3 py-1.5 text-xs rounded-lg font-semibold flex items-center gap-1 transition-all ${
                              isOccupied
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-emerald-500 text-white hover:shadow-md transform hover:scale-105"
                            }`}
                            disabled={isOccupied}
                          >
                            <FaEye />
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
