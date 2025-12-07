"use client";

import React, { useEffect, useState } from "react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import AmenitiesSelector from "./amenities-selector";
import { FaImage } from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("./propertyMap"), { ssr: false });

export default function StepOneMerged() {
  const { property, setProperty, photos, setPhotos } = usePropertyStore();

  const [coords, setCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: (property as any)?.latitude ?? null,
    lng: (property as any)?.longitude ?? null,
  });

  const [addressQuery, setAddressQuery] = useState(
    (property as any)?.street || ""
  );
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolveProvince = (address: any) =>
    address?.state ||
    address?.region ||
    address?.province ||
    address?.county ||
    "";

  /* ---------------- Address Search ---------------- */
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (addressQuery.length < 4) return setAddressResults([]);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            addressQuery
          )}&addressdetails=1&countrycodes=ph`,
          { headers: { "User-Agent": "UPKYP-App/1.0" } }
        );
        const data = await res.json();
        setAddressResults(data);
      } catch (err) {
        console.error("Address search failed", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [addressQuery]);

  /* ---------------- Select Address ---------------- */
  const handleAddressSelect = (place: any) => {
    const { lat, lon, display_name, address } = place;

    const parsed = {
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      street: address?.road || address?.pedestrian || display_name,
      brgyDistrict: address?.suburb || address?.neighbourhood || "",
      city: address?.city || address?.town || address?.village || "",
      province: resolveProvince(address),
      zipCode: address?.postcode || "",
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    };

    setCoords({ lat: parsed.lat, lng: parsed.lng });
    setProperty({ ...property, ...parsed });
    setAddressQuery(parsed.street);
    setAddressResults([]);
  };

  /* ---------------- Handle Inputs ---------------- */
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  /* ---------------- Get Current Location ---------------- */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported by browser.");
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "User-Agent": "UPKYP-App/1.0" } }
          );
          const data = await res.json();
          const address = data.address || {};

          const parsed = {
            street: address.road || data.display_name,
            brgyDistrict: address.suburb || address.neighbourhood || "",
            city: address.city || address.town || address.village || "",
            province: resolveProvince(address),
            zipCode: address.postcode || "",
            latitude,
            longitude,
          };

          setProperty({ ...property, ...parsed });
          setAddressQuery(parsed.street);
        } catch (e) {
          console.error("Reverse geocode failed", e);
          setProperty({ ...property, latitude, longitude });
        }
      },
      (err) => {
        console.error("Location error:", err);
        alert(
          "Unable to access your location. Please enable location permissions and try again."
        );
      }
    );
  };

  /* ---------------- Dropzone ---------------- */
  const onDrop = (acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: true,
  });

  const removeImage = (i: number) => {
    setPhotos(photos.filter((_, idx) => idx !== i));
  };

  /* ---------------- Map Pin Handler ---------------- */
  const handleMapPinSelect = async (lat: number, lng: number) => {
    setCoords({ lat, lng });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "User-Agent": "UPKYP-App/1.0" } }
      );
      const data = await res.json();
      const address = data.address || {};

      const parsed = {
        street: address.road || data.display_name,
        brgyDistrict: address.suburb || address.neighbourhood || "",
        city: address.city || address.town || address.village || "",
        province: resolveProvince(address),
        zipCode: address.postcode || "",
        latitude: lat,
        longitude: lng,
      };

      setProperty({ ...property, ...parsed });
      setAddressQuery(parsed.street);
    } catch (e) {
      console.error("Pin reverse geocode failed:", e);
      setProperty({ ...property, latitude: lat, longitude: lng });
    }

    setShowMapModal(false);
  };

  /* ---------------- AI Description ---------------- */
  const handleGenerateDescription = async () => {
    setLoading(true);

    const p = property as any;

    const prompt = `
Generate a compelling property description:
- Name: ${p.propertyName}
- Type: ${p.propertyType}
- Amenities: ${p.amenities?.join(", ") || "None"}
- Location: ${p.street}, ${p.brgyDistrict}, ${p.city}, ${p.zipCode}, ${
      p.province
    }
        `;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            { role: "system", content: "You are a real estate assistant." },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) setProperty({ ...property, propDesc: text });
    } catch (e) {
      console.error(e);
      alert("Failed to generate description");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Toggle Preferences ---------------- */
  const togglePreference = (key: string) => {
    const prefs = (property as any).propertyPreferences || [];
    setProperty({
      ...property,
      propertyPreferences: prefs.includes(key)
        ? prefs.filter((v: any) => v !== key)
        : [...prefs, key],
    });
  };

  /* ---------------- Amenity Handler ---------------- */
  const handleAmenityChange = (amenity: string) => {
    const arr = (property as any).amenities || [];
    setProperty({
      ...property,
      amenities: arr.includes(amenity)
        ? arr.filter((a: string) => a !== amenity)
        : [...arr, amenity],
    });
  };

  return (
    <div className="bg-white shadow-xl rounded-xl p-5 sm:p-8 lg:p-10 space-y-10 sm:space-y-12 text-[14px] sm:text-[15px]">
      {/* TITLE */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Property Details
        </h2>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Fill in the details below to create a complete listing.
        </p>
      </div>

      <form className="space-y-10 sm:space-y-12">
        {/* ---------------- Property Type ---------------- */}
        <div className="space-y-4" id="property-type-section">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
              1
            </span>
            Property Type
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PROPERTY_TYPES.map((type) => {
              const active = (property as any).propertyType === type.value;
              return (
                <button
                  type="button"
                  key={type.value}
                  onClick={() =>
                    setProperty({ ...property, propertyType: type.value })
                  }
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 text-xs sm:text-sm border rounded-lg transition-all ${
                    active
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-blue-500"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <span className="text-xl sm:text-2xl mb-1">{type.icon}</span>
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- Property Name ---------------- */}
        <div className="space-y-3" id="property-name-section">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
              2
            </span>
            Property Details
          </h2>

          <label className="text-sm font-semibold">Property Name *</label>
          <input
            type="text"
            name="propertyName"
            value={(property as any).propertyName || ""}
            onChange={handleChange}
            className="w-full px-3 py-2.5 text-sm border rounded-lg"
            placeholder="e.g., Sunshine Residences"
          />
        </div>

        {/* ---------------- Location ---------------- */}
        <div className="space-y-4" id="location-section">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
              3
            </span>
            Property Location
          </h2>

          <div>
            <label className="text-sm font-semibold block mb-1.5">
              Street Address *
            </label>
            <input
              type="text"
              name="street"
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value);
                setProperty({ ...property, street: e.target.value });
              }}
              className="w-full px-3 py-2.5 text-sm border rounded-lg"
              placeholder="Start typing address..."
            />

            {addressResults.length > 0 && (
              <ul className="absolute z-20 bg-white border rounded-xl shadow-xl max-h-60 overflow-auto w-full mt-1 text-sm">
                {addressResults.map((res, i) => (
                  <li
                    key={i}
                    onClick={() => handleAddressSelect(res)}
                    className="p-3 hover:bg-blue-50 cursor-pointer"
                  >
                    {res.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <input
              type="text"
              name="brgyDistrict"
              value={(property as any).brgyDistrict || ""}
              onChange={handleChange}
              className="px-3 py-2.5 text-sm border rounded-lg"
              placeholder="Barangay / District"
            />
            <input
              type="text"
              name="city"
              value={(property as any).city || ""}
              onChange={handleChange}
              className="px-3 py-2.5 text-sm border rounded-lg"
              placeholder="City / Municipality"
            />
            <input
              type="number"
              name="zipCode"
              value={(property as any).zipCode || ""}
              onChange={handleChange}
              className="px-3 py-2.5 text-sm border rounded-lg"
              placeholder="Zip Code"
            />
            <input
              type="text"
              name="province"
              value={(property as any).province || ""}
              readOnly
              className="px-3 py-2.5 text-sm border rounded-lg bg-gray-100"
              placeholder="Province (auto-filled)"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Choose how to set location:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center justify-center bg-white border border-blue-200 text-blue-700 px-3 py-2.5 rounded-lg hover:bg-blue-50 text-sm"
              >
                Use Current Location
              </button>

              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="flex items-center justify-center bg-white border border-gray-200 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm"
              >
                Search Address
              </button>

              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="flex items-center justify-center bg-white border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-sm"
              >
                Pin on Map
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- Map Modal ---------------- */}
        {showMapModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-3xl p-4 relative">
              <button
                className="absolute top-2 right-2 bg-gray-200 px-2 py-1 rounded"
                onClick={() => setShowMapModal(false)}
              >
                ✕
              </button>

              <h2 className="text-lg font-semibold mb-3">Select Location</h2>

              <PropertyMap coords={coords} onSelect={handleMapPinSelect} />
            </div>
          </div>
        )}

        {/* ---------------- Amenities ---------------- */}
        <div className="space-y-4" id="amenities-section">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
              4
            </span>
            Amenities
          </h2>

          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 sm:p-6">
            <AmenitiesSelector
              selectedAmenities={(property as any).amenities || []}
              onAmenityChange={handleAmenityChange}
            />
          </div>
        </div>

        {/* ---------------- Description / Others ---------------- */}
        <div className="space-y-10 sm:space-y-12">
          {/* Description */}
          <div className="space-y-3" id="description-section">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
                5
              </span>
              Property Description
            </h2>

            <textarea
              name="propDesc"
              value={(property as any).propDesc || ""}
              onChange={handleChange}
              className="w-full h-28 sm:h-32 px-3 py-2.5 text-sm border rounded-lg"
              placeholder="Describe the property..."
            />

            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={loading}
              className="text-blue-600 underline text-sm sm:text-base"
            >
              {loading ? "Generating..." : "Generate with AI"}
            </button>
          </div>

          {/* Floor Area */}
          <div>
            <label className="font-semibold text-sm">
              Total Property Size (sqm)
            </label>
            <input
              type="number"
              name="floorArea"
              value={(property as any).floorArea || ""}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border rounded-lg"
            />
          </div>

          {/* Preferences */}
          <div className="space-y-4" id="preferences-section">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
                6
              </span>
              Preferences & Rules
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PROPERTY_PREFERENCES.map((pref) => {
                const Icon = pref.icon;
                const isSelected = (
                  (property as any).propertyPreferences || []
                ).includes(pref.key);
                return (
                  <button
                    key={pref.key}
                    onClick={() => togglePreference(pref.key)}
                    className={`p-3 sm:p-4 text-xs sm:text-sm border rounded-lg flex flex-col items-center ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <Icon className="text-lg sm:text-xl mb-1" />
                    {pref.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Billing */}
          <div id="billing-section">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3">
              <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
                7
              </span>
              Utility Billing
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-sm font-semibold">Water Billing</label>
                <select
                  name="waterBillingType"
                  value={(property as any).waterBillingType || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="included">Included</option>
                  <option value="provider">Direct to Provider</option>
                  <option value="submetered">Submetered</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Electricity Billing
                </label>
                <select
                  name="electricityBillingType"
                  value={(property as any).electricityBillingType || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="included">Included</option>
                  <option value="provider">Direct to Provider</option>
                  <option value="submetered">Submetered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4" id="photos-section">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
                8
              </span>
              Property Photos
            </h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed p-4 sm:p-6 rounded-xl cursor-pointer ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <FaImage className="text-3xl sm:text-4xl text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-700 text-sm">
                  {isDragActive
                    ? "Drop photos here..."
                    : "Drag or click to upload"}
                </p>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {photos.map((file: any, i: number) => (
                  <div key={i} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={file.preview}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rent Increase */}
          <div className="space-y-3" id="rent-increase-section">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[11px] sm:text-xs">
                9
              </span>
              Rent Increase Policy
            </h2>

            <label className="text-sm font-semibold">
              Annual Rent Increase (%)
            </label>

            <div className="relative max-w-xs">
              <input
                type="number"
                name="rentIncreasePercent"
                value={(property as any).rentIncreasePercent || ""}
                onChange={handleChange}
                placeholder="5"
                className="w-full px-3 py-2.5 text-sm border rounded-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                %
              </span>
            </div>

            <p className="text-xs text-gray-600">
              Applied annually during lease renewal.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
