"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
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
} from "react-icons/fa";
import { BsImageAlt } from "react-icons/bs";
import { MdVerified } from "react-icons/md";
import Swal from "sweetalert2";

const DynamicMapView = dynamic(() => import("../../../components/mapView"), {
  ssr: false,
});

export default function PropertySearch() {
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [priceRange, setPriceRange] = useState("");
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [visibleMaps, setVisibleMaps] = useState({});
  const [markerIcon, setMarkerIcon] = useState(null);

  const priceRanges = [
    { label: "All Prices", min: "", max: "" },
    { label: "₱1,000 - ₱15,000", min: 1000, max: 15000 },
    { label: "₱15,000 - ₱20,000", min: 15000, max: 20000 },
    { label: "Greater than ₱20,000", min: 20000, max: "" },
  ];

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch("/api/properties/findRent");
        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();
        setAllProperties(data);
        setFilteredProperties(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");

      const icon = new L.Icon({
        iconUrl: "/marker.png",
        iconSize: [30, 30],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41],
      });
      setMarkerIcon(icon);
    }
  }, []);

  const handleToggleMap = (e, propertyId) => {
    e.stopPropagation();
    setVisibleMaps((prev) => ({
      ...prev,
      [propertyId]: !prev[propertyId],
    }));
  };

  const handleViewDetails = (propertyId) => {
    Swal.fire({
      title: "Loading...",
      text: "Redirecting to property details...",
      allowOutsideClick: true,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setTimeout(() => {
      Swal.close();
      router.push(`/pages/find-rent/${propertyId}`);
    }, 1500);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get("searchQuery");
      const locationParam = params.get("location");
      const typeParam = params.get("type");

      if (queryParam) setSearchQuery(queryParam);
      if (locationParam) setLocation(locationParam);
      if (typeParam) setType(typeParam);
    }
  }, []);

  useEffect(() => {
    const filtered = allProperties.filter((property) => {
      const matchesSearch =
        searchQuery === "" ||
        property.property_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.street.toLowerCase().includes(searchQuery.toLowerCase());

      const selectedRange = priceRanges.find(
        (range) => range.label === priceRange
      );
      const minPrice = selectedRange?.min || 0;
      const maxPrice = selectedRange?.max || Infinity;

      const matchesPrice =
        priceRange === "" ||
        (property.rent_amount >= minPrice && property.rent_amount <= maxPrice);

      return matchesSearch && matchesPrice;
    });

    setFilteredProperties(filtered);
  }, [searchQuery, priceRange, allProperties]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-gray-800">
              Find Your Perfect Rental
            </h1>
            <p className="text-lg text-gray-600">
              Discover premium rental properties tailored to your needs
            </p>
          </div>

          {/* Enhanced Search Section */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <FaSearch className="text-gray-400 mx-4 text-lg" />
                    <input
                      type="text"
                      placeholder="Search by property name, city, street, or province..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-4 px-2 outline-none text-gray-700 placeholder-gray-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mr-4 text-gray-400 hover:text-gray-600 transition p-1"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative lg:w-72">
                <button
                  onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                  className="bg-white border-2 border-gray-200 rounded-xl w-full py-4 px-4 flex justify-between items-center hover:border-blue-500 hover:ring-2 hover:ring-blue-100 transition-all"
                  aria-expanded={showPriceDropdown}
                  aria-haspopup="listbox"
                >
                  <div className="flex items-center">
                    <FaFilter className="text-gray-400 mr-3" />
                    <span
                      className={
                        priceRange
                          ? "font-medium text-gray-800"
                          : "text-gray-500"
                      }
                    >
                      {priceRange || "Select Price Range"}
                    </span>
                  </div>
                  <FaChevronDown
                    className={`transition-transform duration-300 ${
                      showPriceDropdown ? "rotate-180" : "rotate-0"
                    } text-gray-400`}
                  />
                </button>

                {showPriceDropdown && (
                  <ul
                    className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-2 z-20 py-2 max-h-60 overflow-auto"
                    role="listbox"
                  >
                    {priceRanges.map((range) => (
                      <li
                        key={range.label}
                        onClick={() => {
                          setPriceRange(range.label);
                          setShowPriceDropdown(false);
                        }}
                        className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition ${
                          priceRange === range.label
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-700"
                        }`}
                        role="option"
                        aria-selected={priceRange === range.label}
                      >
                        {range.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || (priceRange && priceRange !== "All Prices")) && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {searchQuery && (
                  <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {priceRange && priceRange !== "All Prices" && (
                  <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Price: {priceRange}
                    <button
                      onClick={() => setPriceRange("")}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="flex justify-center mb-6">
              <FaSearch className="text-gray-300 text-6xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">
              No properties found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or price range to find more
              options.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setPriceRange("");
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg text-gray-700">
                <span className="font-semibold">
                  {filteredProperties.length}
                </span>{" "}
                {filteredProperties.length === 1 ? "property" : "properties"} found
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div
                  key={property.property_id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200"
                >
                  {/* Property Image */}
                  <div className="relative group">
                    {property?.property_photo ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={property?.property_photo}
                          alt={property?.property_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <BsImageAlt className="text-3xl text-gray-400 mx-auto mb-2" />
                          <span className="text-gray-400 text-sm">
                            No Image Available
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Overlay badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {property?.flexipay_enabled === 1 && (
                        <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1 shadow-md">
                          <span>FlexiPay</span>
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
                  </div>

                  {/* Property Details */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-bold text-gray-900 line-clamp-1">
                        {property?.property_name}
                      </h2>
                      <div className="flex items-center gap-1 ml-2">
                        <MdVerified className="text-blue-500 text-lg" />
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600 mb-3">
                      <FaMapMarkerAlt className="mr-2 text-gray-400 text-sm" />
                      <p className="text-sm text-gray-700">
                        {property?.city},{" "}
                        {property?.province
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-2xl font-bold text-blue-600">
                        ₱{Math.round(property.rent_amount).toLocaleString()}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          /month
                        </span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(property.property_id);
                        }}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FaEye className="text-sm" />
                        View Details
                      </button>

                      <button
                        onClick={(e) =>
                          handleToggleMap(e, property.property_id)
                        }
                        className={`px-4 py-2.5 border-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                          visibleMaps[property.property_id]
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                        }`}
                        title={
                          visibleMaps[property.property_id]
                            ? "Hide Map"
                            : "Show Map"
                        }
                      >
                        <FaMap className="text-sm" />
                      </button>
                    </div>

                    {/* Map Section */}
                    {visibleMaps[property.property_id] && (
                      <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                        {property.latitude && property.longitude ? (
                          <div className="h-64">
                            <DynamicMapView
                              coords={{
                                lat: parseFloat(property.latitude),
                                lng: parseFloat(property.longitude),
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-32 bg-gray-100 flex items-center justify-center">
                            <p className="text-red-500 text-sm">
                              Invalid coordinates
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
