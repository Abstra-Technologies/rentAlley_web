"use client";
import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import AmenitiesSelector from "@/components/landlord/createProperty/amenities-selector";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { FaInfoCircle } from "react-icons/fa";
import { Camera, X, Sparkles } from "lucide-react";
import { useEffect } from "react";

const PropertyMapWrapper = dynamic(
    () => import("@/components/landlord/createProperty/propertyMapWrapper"),
    { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export const StepOneEdit = ({ propertyId }: { propertyId: number }) => {
    const { property, setProperty, photos, setPhotos } =
        useEditPropertyStore();

    const [coords, setCoords] = useState({ lat: null, lng: null });
    const [addressQuery, setAddressQuery] = useState("");
    const [addressResults, setAddressResults] = useState<any[]>([]);
    const [loadingAI, setLoadingAI] = useState(false);
    const addressRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    /* =========================================================
       PROPERTY DETAILS (SWR)
    ========================================================= */
    useEffect(() => {
        if (!propertyId) return;

        let mounted = true;

        (async () => {
            try {
                const res = await fetch(
                    `/api/propertyListing/editProperty?property_id=${propertyId}`
                );
                const data = await res.json();

                if (!mounted || !data?.length) return;

                const p = data[0];

                const mapped = {
                    propertyName: p.property_name,
                    propertyType: p.property_type,
                    amenities: p.amenities || [],
                    street: p.street,
                    brgyDistrict: p.brgy_district,
                    city: p.city,
                    zipCode: p.zip_code,
                    province: p.province,
                    description: p.description,
                    floorArea: p.floor_area,
                    minStay: p.min_stay,
                    water_billing_type: p.water_billing_type,
                    electricity_billing_type: p.electricity_billing_type,
                    propertyPreferences: p.property_preferences || [],
                    paymentMethodsAccepted: p.accepted_payment_methods || [],
                    lat: p.latitude,
                    lng: p.longitude,
                };

                setProperty(mapped);
                setCoords({ lat: mapped.lat, lng: mapped.lng });
                setAddressQuery(mapped.street || "");
            } catch (err) {
                console.error("Failed to fetch property details:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [propertyId]);

    /* =========================================================
       EXISTING PHOTOS (SWR)
    ========================================================= */
    useEffect(() => {
        if (!propertyId) return;

        let mounted = true;

        (async () => {
            try {
                const res = await fetch(
                    `/api/propertyListing/propertyPhotos?property_id=${propertyId}`
                );
                const data = await res.json();

                if (!mounted) return;

                const mapped = data.map((p: any) => ({
                    file: null,
                    preview: p.photo_url,
                    photo_id: p.photo_id,
                    isNew: false,
                }));

                setPhotos(mapped);
            } catch (err) {
                console.error("Failed to fetch property photos:", err);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [propertyId]);

    /* =========================================================
       ADDRESS SEARCH
    ========================================================= */
    const searchAddress = async (value: string) => {
        setAddressQuery(value);
        if (value.length < 4) {
            setAddressResults([]);
            return;
        }

        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                value
            )}&addressdetails=1&countrycodes=ph`
        );
        setAddressResults(await res.json());
    };

    const handleAddressSelect = (place: any) => {
        const parsed = {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
            street: place.address?.road || place.display_name,
            brgyDistrict: place.address?.suburb || "",
            city: place.address?.city || place.address?.town || "",
            province: place.address?.region || "",
            zipCode: place.address?.postcode || "",
        };

        setCoords({ lat: parsed.lat, lng: parsed.lng });
        setProperty({ ...property, ...parsed });
        setAddressQuery(parsed.street);
        setAddressResults([]);
        addressRef.current?.blur();
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setProperty({ ...property, [name]: value });
    };

    /* =========================================================
       AMENITIES
    ========================================================= */
    const toggleAmenity = (amenity: string) => {
        const list = property.amenities || [];
        setProperty({
            ...property,
            amenities: list.includes(amenity)
                ? list.filter((a) => a !== amenity)
                : [...list, amenity],
        });
    };

    /* =========================================================
       PREFERENCES
    ========================================================= */
    const togglePreference = (key: string) => {
        const list = property.propertyPreferences || [];
        setProperty({
            ...property,
            propertyPreferences: list.includes(key)
                ? list.filter((x) => x !== key)
                : [...list, key],
        });
    };

    /* =========================================================
       PHOTO UPLOAD + DELETE
    ========================================================= */
    const onDrop = (acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            isNew: true,
        }));
        setPhotos([...photos, ...newFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: true,
    });

    const removePhoto = async (photo: any) => {
        try {
            // 🔴 CASE 1: already saved photo → delete from backend
            if (!photo.isNew && photo.photo_id) {
                await axios.delete("/api/propertyListing/deletPropertyPhotos", {
                    data: {
                        photo_id: photo.photo_id,
                        property_id: propertyId,
                    },
                });

                // remove saved photo by ID
                setPhotos((prev) =>
                    prev.filter((p) => p.photo_id !== photo.photo_id)
                );
                return;
            }

            // 🟡 CASE 2: new photo (not uploaded yet) → local only
            setPhotos((prev) =>
                prev.filter((p) => p.preview !== photo.preview)
            );
        } catch (err) {
            console.error("Photo delete failed:", err);
            alert("Failed to delete photo.");
        }
    };



    /* =========================================================
       AI DESCRIPTION
    ========================================================= */
    const generateDescription = async () => {
        setLoadingAI(true);
        try {
            const res = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "deepseek/deepseek-r1:free",
                        messages: [
                            { role: "system", content: "You write property descriptions." },
                            {
                                role: "user",
                                content: `Generate a rental property description for:
                Name: ${property.propertyName}
                Type: ${property.propertyType}
                Amenities: ${property.amenities?.join(", ")}
                Location: ${property.street}, ${property.city}`,
                            },
                        ],
                    }),
                }
            );

            const data = await res.json();
            if (data?.choices?.[0]?.message?.content) {
                setProperty({
                    ...property,
                    description: data.choices[0].message.content,
                });
            }
        } catch {
            alert("AI generation failed.");
        }
        setLoadingAI(false);
    };

  // SKELETON LOADING
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Property Type Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="h-5 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Property Name Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="h-5 bg-gray-300 rounded w-36"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Map Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="h-5 bg-gray-300 rounded w-40"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Address Fields Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>

        {/* Description Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="h-5 bg-gray-300 rounded w-28"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Photos Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="h-5 bg-gray-300 rounded w-36"></div>
          </div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  /* =========================================================
       FULL PAGE UI — EVERYTHING COMBINED
    ========================================================== */
  return (
    <div className="space-y-6">
      {/* PROPERTY TYPE */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            1
          </div>
          <label className="text-base sm:text-lg font-semibold text-gray-800">
            Property Type
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PROPERTY_TYPES.map((type) => {
            const active = property.propertyType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setProperty({ ...property, propertyType: type.value })
                }
                className={`p-3 sm:p-4 rounded-xl shadow-sm transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                <span className="text-xl sm:text-2xl block mb-1">
                  {type.icon}
                </span>
                <p className="text-xs sm:text-sm font-medium">{type.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* PROPERTY NAME */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            2
          </div>
          <label className="text-base sm:text-lg font-semibold text-gray-800">
            Property Name
          </label>
        </div>
        <input
          type="text"
          name="propertyName"
          value={property.propertyName || ""}
          onChange={handleChange}
          placeholder="Enter property name"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* MAP */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            3
          </div>
          <label className="text-base sm:text-lg font-semibold text-gray-800">
            Property Location
          </label>
        </div>
        <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm h-64 sm:h-80 relative z-0">
          <PropertyMapWrapper
            coordinates={
              coords.lat && coords.lng ? [coords.lat, coords.lng] : null
            }
            setFields={({
              latitude,
              longitude,
              street,
              brgyDistrict,
              city,
              province,
              zipCode,
            }) => {
              setCoords({ lat: latitude, lng: longitude });
              setProperty({
                ...property,
                lat: latitude,
                lng: longitude,
                street,
                brgyDistrict,
                city,
                province,
                zipCode,
              });
              setAddressQuery(street);
            }}
          />
        </div>
      </div>

      {/* ADDRESS SEARCH */}
      <div className="space-y-3 relative">
        <label className="text-xs sm:text-sm font-semibold text-gray-700">
          Street
        </label>
        <input
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          placeholder="Search for address..."
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />

        {addressResults.length > 0 && (
          <ul className="absolute bg-white border border-gray-200 rounded-xl mt-2 w-full max-h-60 overflow-auto z-40 shadow-xl">
            {addressResults.map((item, i) => (
              <li
                key={i}
                onClick={() => handleAddressSelect(item)}
                className="p-3 hover:bg-blue-50 cursor-pointer text-xs sm:text-sm transition-colors border-b border-gray-100 last:border-b-0"
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Auto-Filled */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-gray-700">
            Barangay
          </label>
          <input
            readOnly
            value={property.brgyDistrict || ""}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-100 border border-gray-200 rounded-xl"
            placeholder="Barangay"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-gray-700">
            City
          </label>
          <input
            name="city"
            onChange={handleChange}
            value={property.city || ""}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="City"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-gray-700">
            ZIP Code
          </label>
          <input
            name="zipCode"
            onChange={handleChange}
            value={property.zipCode || ""}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="ZIP Code"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-gray-700">
            Province
          </label>
          <input
            readOnly
            value={property.province || ""}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-100 border border-gray-200 rounded-xl"
            placeholder="Province"
          />
        </div>
      </div>

      {/* AMENITIES */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            4
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Amenities
          </h2>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 border border-gray-200 rounded-xl">
          <AmenitiesSelector
            selectedAmenities={property.amenities || []}
            onAmenityChange={toggleAmenity}
          />
        </div>
      </div>

      {/* DESCRIPTION + AI */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            5
          </div>
          <label className="text-base sm:text-lg font-semibold text-gray-800">
            Description
          </label>
        </div>
        <textarea
          name="description"
          rows={5}
          onChange={handleChange}
          value={property.description || ""}
          placeholder="Describe your property..."
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
        />
        <button
          type="button"
          onClick={generateDescription}
          disabled={loadingAI}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingAI ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI</span>
            </>
          )}
        </button>
      </div>

      {/* FLOOR AREA */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            6
          </div>
          <label className="text-base sm:text-lg font-semibold text-gray-800">
            Total Property Size (sqm)
          </label>
        </div>
        <input
          type="number"
          name="floorArea"
          value={property.floorArea || ""}
          onChange={handleChange}
          placeholder="Enter floor area"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* PREFERENCES */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            7
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Property Preferences
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PROPERTY_PREFERENCES.map((pref) => {
            const Icon = pref.icon;
            const active = property.propertyPreferences?.includes(pref.key);
            return (
              <button
                key={pref.key}
                type="button"
                onClick={() => togglePreference(pref.key)}
                className={`p-3 sm:p-4 rounded-xl shadow-sm transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                <Icon className="text-lg sm:text-xl mb-1 mx-auto" />
                <p className="text-xs sm:text-sm font-medium">{pref.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* UTILITY BILLING */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            8
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Utility Billing
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="font-semibold flex items-center gap-1 text-xs sm:text-sm">
              Water Billing <FaInfoCircle className="text-blue-500 text-xs" />
            </label>
            <select
              name="water_billing_type"
              onChange={handleChange}
              value={property.water_billing_type || ""}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1.25rem",
              }}
            >
              <option value="">Select type</option>
              {UTILITY_BILLING_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-semibold flex items-center gap-1 text-xs sm:text-sm">
              Electricity Billing{" "}
              <FaInfoCircle className="text-blue-500 text-xs" />
            </label>
            <select
              name="electricity_billing_type"
              onChange={handleChange}
              value={property.electricity_billing_type || ""}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1.25rem",
              }}
            >
              <option value="">Select type</option>
              {UTILITY_BILLING_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PHOTO UPLOAD */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
            9
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Property Photos
          </h2>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 sm:p-8 rounded-xl cursor-pointer transition-all ${
            isDragActive
              ? "border-blue-500 bg-blue-50 shadow-inner"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
              <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Drag or upload images
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">
              PNG, JPG up to 10MB
            </p>
          </div>
        </div>

          {photos.length > 0 && (
              <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
                      {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((photo) => (
                          <div
                              key={photo.photo_id ?? photo.preview}
                              className="relative group aspect-square"
                          >
                              <img
                                  src={photo.preview}
                                  alt="Property photo"
                                  className="w-full h-full object-cover rounded-xl border border-gray-200"
                              />

                              <button
                                  type="button"
                                  onClick={() => removePhoto(photo)}
                                  className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                              >
                                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>

                              {/* 👇 FIXED OVERLAY */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all pointer-events-none"></div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};
