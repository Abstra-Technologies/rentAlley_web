import React, { useEffect, useRef, useState } from "react";
import usePropertyStore from "../../zustand/property/usePropertyStore";
import { PROPERTY_TYPES } from "../../constant/propertyTypes";
import dynamic from "next/dynamic";
const PropertyMap = dynamic(() => import("../propertyMap"), { ssr: false });

export const StepOne = () => {
  const { property, setProperty } = usePropertyStore();
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapMode, setMapMode] = useState("search");

  useEffect(() => {
    if (!property.propertyType && PROPERTY_TYPES.length > 0) {
      setProperty({ propertyType: PROPERTY_TYPES[0].value });
    }
  }, [property.propertyType]);

  // Debounced OSM search for address input
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (addressQuery.length < 4) {
        setAddressResults([]);
        return;
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            addressQuery
          )}&addressdetails=1&countrycodes=ph`
        );
        const data = await res.json();
        setAddressResults(data);
      } catch (err) {
        console.error("Address search failed", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [addressQuery]);

  const handleAddressSelect = (place) => {
    const { lat, lon, display_name, address } = place;

    const parsed = {
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      street: address.road || display_name,
      brgyDistrict: address.suburb || address.neighbourhood || "",
      city: address.city || address.town || address.village || "",
      province: address.region || "",
      zipCode: address.postcode || "",
    };

    setCoords({ lat: parsed.lat, lng: parsed.lng });
    setProperty({ ...property, ...parsed });
    setAddressQuery(parsed.street);
    setAddressResults([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          // Reverse geocode to get address
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
            .then((res) => res.json())
            .then((data) => {
              const address = data.address || {};
              const parsed = {
                lat: latitude,
                lng: longitude,
                street: address.road || data.display_name,
                brgyDistrict: address.suburb || address.neighbourhood || "",
                city: address.city || address.town || address.village || "",
                province: address.region || "",
                zipCode: address.postcode || "",
              };
              setProperty({ ...property, ...parsed });
              setAddressQuery(parsed.street);
            });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  const openMapModal = () => {
    setShowMapModal(true);
  };

  const confirmMapLocation = () => {
    setShowMapModal(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          List New Property
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
          List it in the market where renters are waiting!
        </p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <form className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Property Type Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  1
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Property Type
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {PROPERTY_TYPES.map((type) => {
                const isSelected = property.propertyType === type.value;
                return (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() =>
                      setProperty({ ...property, propertyType: type.value })
                    }
                    className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-blue-500 shadow-lg transform scale-105"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                    }`}
                  >
                    <span className="text-xl sm:text-2xl mb-1 sm:mb-2">
                      {type.icon}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-center">
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Property Name Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  2
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Property Details
              </h2>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="propertyName"
                className="block text-sm font-semibold text-gray-700"
              >
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="propertyName"
                name="propertyName"
                placeholder="e.g., XYZ Residences, Sunshine Apartments"
                value={property.propertyName || ""}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  3
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Property Location
              </h2>
            </div>

            {/* Location Input Methods */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Choose how you'd like to set your location:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center justify-center space-x-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Use Current Location</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMapMode("search")}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
                    mapMode === "search"
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                      : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Search Address</span>
                </button>

                <button
                  type="button"
                  onClick={openMapModal}
                  className="flex items-center justify-center space-x-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
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
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <span>Pin on Map</span>
                </button>
              </div>
            </div>

            {/* Search Mode - Address Input */}
            {mapMode === "search" && (
              <div className="space-y-4">
                {/* Street Address with Search */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="street"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      placeholder="Start typing your address..."
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                    />
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {addressResults.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg sm:rounded-xl shadow-2xl max-h-60 overflow-auto mt-1">
                      {addressResults.map((result, index) => (
                        <li
                          key={index}
                          onClick={() => handleAddressSelect(result)}
                          className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors duration-150 flex items-start space-x-2"
                        >
                          <svg
                            className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{result.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Location Confirmation */}
                {coords.lat && coords.lng && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-medium">Location Confirmed</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                    <button
                      type="button"
                      onClick={openMapModal}
                      className="text-xs text-green-600 hover:text-green-700 mt-2 underline"
                    >
                      Adjust on map
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Address Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Barangay/District */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Barangay/District
                </label>
                <input
                  type="text"
                  name="brgyDistrict"
                  value={property.brgyDistrict || ""}
                  onChange={handleChange}
                  placeholder="Enter barangay or district"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  City / Municipality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={property.city || ""}
                  onChange={handleChange}
                  placeholder="Enter city or municipality"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                />
              </div>

              {/* ZIP Code */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="number"
                  name="zipCode"
                  value={property.zipCode || ""}
                  onChange={handleChange}
                  placeholder="e.g., 1234"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                />
              </div>

              {/* Province */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Province
                </label>
                <input
                  type="text"
                  name="province"
                  value={property.province || ""}
                  onChange={handleChange}
                  placeholder="Auto-filled from location selection"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl bg-gray-100 text-gray-600 text-sm sm:text-base"
                  readOnly
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Property Location
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <PropertyMap
                coordinates={
                  coords.lat && coords.lng ? [coords.lat, coords.lng] : null
                }
                setFields={({
                  lat,
                  lng,
                  address,
                  barangay,
                  city,
                  province,
                  region,
                  postcode,
                }) => {
                  setCoords({ lat, lng });
                  setProperty({
                    ...property,
                    lat,
                    lng,
                    street: address,
                    brgyDistrict: barangay,
                    city,
                    province: region,
                    zipCode: postcode || "",
                  });
                  setAddressQuery(address);
                }}
              />
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {coords.lat && coords.lng ? (
                    <span className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>
                        Location selected: {coords.lat.toFixed(6)},{" "}
                        {coords.lng.toFixed(6)}
                      </span>
                    </span>
                  ) : (
                    "Click on the map to select a location"
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmMapLocation}
                    disabled={!coords.lat || !coords.lng}
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    Confirm Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
