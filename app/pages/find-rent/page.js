"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiBadgeCheck } from "react-icons/hi";
import {
  FaSearch,
  FaChevronDown,
  FaMapMarkerAlt,
  FaSpinner,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "/marker.png",
  iconSize: [30, 30],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
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


  const handleCardClick = (property) => {
    setSelectedCoords({
      lat: parseFloat(property.latitude),
      lng: parseFloat(property.longitude),
    });
    setSelectedProperty(property);
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

    // Simulate delay before redirecting
    setTimeout(() => {
      Swal.close();
      router.push(`/pages/find-rent/${propertyId}`);
    }, 1500); // 1.5 seconds delay
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get("searchQuery");
    const locationParam = params.get("location");
    const typeParam = params.get("type");

    if (queryParam) setSearchQuery(queryParam);
    if (locationParam) setLocation(locationParam);
    if (typeParam) setType(typeParam);

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

  if (loading)
    return <p className="text-center text-lg">Loading properties...</p>;

  return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Find Your Perfect Rental
          </h1>
          <p className="text-gray-600">
            Browse our selection of premium rental properties
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                <FaSearch className="text-gray-400 mx-3" />
                <input
                    type="text"
                    placeholder="Search by property name, city, street, or province..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3 px-2 outline-none"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="mr-3 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                )}
              </div>
            </div>

            <div className="relative md:w-64">
              <button
                  onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                  className="border-2 border-gray-200 rounded-lg w-full py-3 px-4 flex justify-between items-center hover:border-blue-500 transition bg-white"
                  aria-expanded={showPriceDropdown}
                  aria-haspopup="listbox"
              >
              <span
                  className={
                    priceRange ? "font-medium text-gray-800" : "text-gray-500"
                  }
              >
                {priceRange || "Select Price Range"}
              </span>
                <FaChevronDown
                    className={`transition-transform duration-300 ${
                        showPriceDropdown ? "rotate-180" : "rotate-0"
                    } text-gray-400`}
                />
              </button>

              {showPriceDropdown && (
                  <ul
                      className="absolute w-full border bg-white rounded-lg shadow-lg mt-1 z-20 py-1 max-h-60 overflow-auto"
                      role="listbox"
                  >
                    {priceRanges.map((range) => (
                        <li
                            key={range.label}
                            onClick={() => {
                              setPriceRange(range.label);
                              setShowPriceDropdown(false);
                            }}
                            className={`p-3 hover:bg-blue-50 cursor-pointer ${
                                priceRange === range.label ? "bg-blue-100" : ""
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

          {(searchQuery || priceRange) && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {priceRange && priceRange !== "All Prices" && (
                    <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Price: {priceRange}
              </span>
                )}
              </div>
          )}
        </div>

        {loading ? (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-blue-500 text-3xl" />
            </div>
        ) : filteredProperties.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <div className="flex justify-center mb-4">
                <FaSearch className="text-gray-400 text-5xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No properties found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or price range to find more
                options.
              </p>
            </div>
        ) : (
            <>
              <div className="mb-4 text-gray-600">
                Found {filteredProperties.length} propert
                {filteredProperties.length === 1 ? "y" : "ies"}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => {
                  return (
                      <div>
                      <div
                          key={property.property_id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleViewDetails(property.property_id)}
                      >
                      </div>
                        <div className="relative">
                          {property?.property_photo ? (
                              <div className="relative h-48">
                                <Image
                                    src={property?.property_photo}
                                    alt={property?.property_name}
                                    fill
                                    className="object-cover"
                                />
                              </div>
                          ) : (
                              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">
                          No Image Available
                        </span>
                              </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                              {property?.property_name}
                            </h2>
                            <div className="flex items-center gap-1">
                              <HiBadgeCheck className="text-blue-500 text-lg" />
                              <span className="text-blue-600 font-medium text-sm">
                          Verified
                        </span>
                              {property?.flexipay_enabled === 1 && (
                                  <div className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full flex items-center gap-1">
                                    <span>FlexiPay</span>
                                    <svg
                                        className="w-3 h-3 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600 mt-2">
                            <FaMapMarkerAlt className="mr-1 text-gray-400" />
                            <p className="text-gray-800">
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

                          <p className="text-xl font-semibold text-blue-600 mt-1">
                            ₱{Math.round(property.rent_amount).toLocaleString()}
                          </p>

                          <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering parent click event
                                handleViewDetails(property.property_id);
                              }}
                              className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 font-medium transition-colors"
                          >
                            View Details
                          </button>
                            <button
                                className="mt-2 px-4 py-1 text-sm bg-blue-500 text-white rounded"
                                onClick={() => handleCardClick(property)}
                            >
                                View Map
                            </button>

                            {selectedProperty?.propertyID === property.propertyID && selectedCoords && (
                                <div className="mt-4">
                                    <h3 className="font-semibold">Map Location:</h3>
                                    <iframe
                                        width="100%"
                                        height="250"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        src={`https://maps.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}&z=15&output=embed`}
                                    />
                                </div>
                            )}

                        </div>
                      </div>
                  );
                })}
              </div>
            </>
        )}
      </div>
  );
}
