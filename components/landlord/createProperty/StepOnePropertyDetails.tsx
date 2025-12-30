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

  const [coords, setCoords] = useState({
    lat: property?.latitude ?? 14.5995,
    lng: property?.longitude ?? 120.9842,
  });

  const [addressQuery, setAddressQuery] = useState(property?.street || "");
  const [addressResults, setAddressResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const resolveProvince = (address) =>
    address?.state ||
    address?.region ||
    address?.province ||
    address?.county ||
    "";

  /* -----------------------------------------
       ADDRESS AUTOCOMPLETE SEARCH
    ----------------------------------------- */
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (addressQuery.length < 4) return setAddressResults([]);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            addressQuery
          )}&addressdetails=1&countrycodes=ph`
        );
        const data = await res.json();
        setAddressResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [addressQuery]);

  /* -----------------------------------------
       SELECT ADDRESS FROM AUTOCOMPLETE
    ----------------------------------------- */
  const handleAddressSelect = (place) => {
    const { lat, lon, display_name, address } = place;

    const parsed = {
      street: address?.road || address?.pedestrian || display_name || "",
      brgyDistrict: address?.suburb || address?.neighbourhood || "",
      city: address?.city || address?.town || address?.village || "",
      province: resolveProvince(address),
      zipCode: address?.postcode || "",
      latitude: Number(lat),
      longitude: Number(lon),
    };

    // Update global Zustand store
    setProperty({ ...property, ...parsed });

    // Update UI
    setAddressQuery(parsed.street);
    setCoords({ lat: parsed.latitude, lng: parsed.longitude });

    // Hide dropdown
    setAddressResults([]);
  };

  /* -----------------------------------------
       GENERIC FORM INPUT HANDLER
    ----------------------------------------- */
  const handleChange = (e) => {
    setProperty({ ...property, [e.target.name]: e.target.value });
  };

  /* -----------------------------------------
       PHOTO UPLOAD
    ----------------------------------------- */
  const onDrop = (acceptedFiles) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop,
  });

  const removeImage = (i) => {
    setPhotos(photos.filter((_, idx) => idx !== i));
  };

  /* -----------------------------------------
       AI DESCRIPTION
    ----------------------------------------- */
  const handleGenerateDescription = async () => {
    setLoading(true);

    const p = property;

    const prompt = `
    Create a compelling property description based on:
    Name: ${p.propertyName}
    Type: ${p.propertyType}
    Amenities: ${p.amenities?.join(", ") || "None"}
    Address: ${p.street}, ${p.brgyDistrict}, ${p.city}, ${p.zipCode}, ${
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
    } catch (err) {
      console.error(err);
      alert("Failed to generate description");
    }

    setLoading(false);
  };

  /* -----------------------------------------
       MAP CALLBACK → updates form fields LIVE
    ----------------------------------------- */
  const mapSetFields = (data) => {
    if (!data) return;

    const parsed = {
      street: data.street || "",
      brgyDistrict: data.brgyDistrict || "",
      city: data.city || "",
      province: data.province || "",
      zipCode: data.zipCode || "",
      latitude: data.latitude,
      longitude: data.longitude,
    };

    setProperty({ ...property, ...parsed });

    if (parsed.street) setAddressQuery(parsed.street);
    setCoords({ lat: parsed.latitude, lng: parsed.longitude });
  };

  /* -----------------------------------------
       TOGGLE PREFERENCES
    ----------------------------------------- */
  const togglePreference = (key) => {
    const prefs = property.propertyPreferences || [];
    setProperty({
      ...property,
      propertyPreferences: prefs.includes(key)
        ? prefs.filter((v) => v !== key)
        : [...prefs, key],
    });
  };

  /* -----------------------------------------
       PAGE RENDER
    ----------------------------------------- */
  return (
    <div className="bg-white shadow-xl rounded-xl p-4 sm:p-6 lg:p-10 space-y-10">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Property Details</h1>
        <p className="text-gray-600 text-sm sm:text-base mt-1">
          Fill in the details below.
        </p>
      </div>

      {/* FIX: Changed from <form> to <div> to prevent page refresh */}
      <div className="space-y-10">
        {/* PROPERTY TYPE */}
        <section id="property-type-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            1. Property Type
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PROPERTY_TYPES.map((type) => {
              const active = property.propertyType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setProperty({ ...property, propertyType: type.value })
                  }
                  className={`
                  flex flex-col items-center justify-center
                  min-h-[88px] sm:min-h-[96px]
                  p-3 rounded-xl border text-sm transition
                  ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "border-gray-300 hover:bg-blue-50"
                  }
                `}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  <span className="text-center leading-tight">
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* PROPERTY NAME */}
        <section id="property-name-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-2">
            2. Property Name
          </h2>
          <input
            type="text"
            name="propertyName"
            value={property.propertyName || ""}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border rounded-lg"
            placeholder="e.g., Sunshine Residences"
          />
        </section>

        {/* LOCATION */}
        <section id="location-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            3. Property Location
          </h2>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
            {/* ADDRESS FIELDS */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <label className="text-sm font-medium">Street Address *</label>
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(e) => {
                    setAddressQuery(e.target.value);
                    setProperty({ ...property, street: e.target.value });
                  }}
                  className="w-full px-3 py-2.5 border rounded-lg"
                />

                {addressResults.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border rounded-xl shadow max-h-60 overflow-auto">
                    {addressResults.map((res, i) => (
                      <li
                        key={i}
                        onClick={() => handleAddressSelect(res)}
                        className="p-3 text-sm cursor-pointer hover:bg-blue-50"
                      >
                        {res.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  name="brgyDistrict"
                  value={property.brgyDistrict || ""}
                  onChange={handleChange}
                  placeholder="Barangay / District"
                  className="px-3 py-2.5 border rounded-lg"
                />

                <input
                  name="city"
                  value={property.city || ""}
                  onChange={handleChange}
                  placeholder="City / Municipality"
                  className="px-3 py-2.5 border rounded-lg"
                />

                <input
                  name="zipCode"
                  type="number"
                  value={property.zipCode || ""}
                  onChange={handleChange}
                  placeholder="Zip Code"
                  className="px-3 py-2.5 border rounded-lg"
                />

                <input
                  name="province"
                  value={property.province || ""}
                  readOnly
                  placeholder="Province"
                  className="px-3 py-2.5 border rounded-lg bg-gray-100"
                />
              </div>
            </div>

            {/* MAP */}
            <div className="relative w-full h-[220px] sm:h-[260px] lg:h-full rounded-xl overflow-hidden border">
              <PropertyMap
                setFields={mapSetFields}
                coordinates={[coords.lat, coords.lng]}
              />
            </div>
          </div>
        </section>

        {/* AMENITIES */}
        <section id="amenities-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            4. Amenities
          </h2>
          <div className="p-3 sm:p-4 bg-blue-50 rounded-xl">
            <AmenitiesSelector
              selectedAmenities={property.amenities || []}
              onAmenityChange={(a) => {
                const arr = property.amenities || [];
                setProperty({
                  ...property,
                  amenities: arr.includes(a)
                    ? arr.filter((x) => x !== a)
                    : [...arr, a],
                });
              }}
            />
          </div>
        </section>

        {/* DESCRIPTION */}
        <section id="description-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            5. Property Description
          </h2>
          <textarea
            name="propDesc"
            value={property.propDesc || ""}
            onChange={handleChange}
            className="w-full h-32 border rounded-lg px-3 py-2"
          />
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={loading}
            className="mt-2 text-sm text-blue-600 underline"
          >
            {loading ? "Generating..." : "Generate with AI"}
          </button>
        </section>

        {/* FLOOR AREA */}
        <section id="floor-area-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            6. Total Property Size
          </h2>
          <input
            type="number"
            name="floorArea"
            value={property.floorArea || ""}
            onChange={handleChange}
            className="w-full sm:max-w-xs px-3 py-2.5 border rounded-lg"
            placeholder="sqm"
          />
        </section>

        {/* PREFERENCES */}
        <section id="preferences-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            7. Preferences & Rules
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PROPERTY_PREFERENCES.map((pref) => {
              const Icon = pref.icon;
              const active = property.propertyPreferences?.includes(pref.key);

              return (
                <button
                  key={pref.key}
                  type="button"
                  onClick={() => togglePreference(pref.key)}
                  className={`
                  flex flex-col items-center justify-center
                  min-h-[88px]
                  p-3 rounded-xl border text-sm
                  ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300"
                  }
                `}
                >
                  <Icon className="text-lg mb-1" />
                  <span className="text-center leading-tight">
                    {pref.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* UTILITY BILLING */}
        <section id="billing-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            8. Utility Configuration (Water and Electricity)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              name="waterBillingType"
              value={property.waterBillingType || ""}
              onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg"
            >
              <option value="">Water Billing</option>
              <option value="included">Included</option>
              <option value="submetered">Submetered</option>
            </select>

            <select
              name="electricityBillingType"
              value={property.electricityBillingType || ""}
              onChange={handleChange}
              className="px-3 py-2.5 border rounded-lg"
            >
              <option value="">Electricity Billing</option>
              <option value="included">Included</option>
              <option value="submetered">Submetered</option>
            </select>
          </div>
        </section>

        {/* PHOTOS */}
        <section id="photos-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            9. Property Photos
          </h2>

          <div
            {...getRootProps()}
            className={`
            border-2 border-dashed rounded-xl p-5 text-center cursor-pointer
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          `}
          >
            <input {...getInputProps()} />
            <FaImage className="text-3xl text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600 mt-2">
              {isDragActive ? "Drop photos here…" : "Tap or drag images here"}
            </p>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {photos.map((p, i) => (
                <div key={i} className="relative group">
                  <img
                    src={p.preview}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RENT INCREASE */}
        <section id="rent-increase-section" className="bg-white p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            10. Rent Increase Policy
          </h2>

          <div className="relative w-full sm:max-w-xs">
            <input
              type="number"
              name="rentIncreasePercent"
              value={property.rentIncreasePercent || ""}
              onChange={handleChange}
              placeholder="5"
              className="w-full px-3 py-2.5 border rounded-lg"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
              %
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Applied annually during lease renewal.
          </p>
        </section>
      </div>
    </div>
  );
}
