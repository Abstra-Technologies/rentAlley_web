"use client";

import React, { useEffect, useState } from "react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";
import AmenitiesSelector from "./amenities-selector";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import {
  Building2,
  MapPin,
  FileText,
  Ruler,
  Heart,
  Zap,
  ImagePlus,
  Camera,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

const PropertyMapWrapper = dynamic(() => import("./propertyMapWrapper"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

// Map loading skeleton
function MapSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({
  number,
  icon: Icon,
  title,
  subtitle,
  required,
}: {
  number: number;
  icon: any;
  title: string;
  subtitle?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-4">
      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/25 flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
            {title}
          </h3>
          {required && (
            <span className="text-[10px] sm:text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
              Required
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Input Field Component
function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  required = false,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-xl transition-all outline-none ${
          readOnly
            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
            : "border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        }`}
      />
    </div>
  );
}

export default function StepOneCreateProperty() {
  const { property, setProperty, photos, setPhotos } = usePropertyStore();

  const [coords, setCoords] = useState({
    lat: property?.latitude ?? null,
    lng: property?.longitude ?? null,
  });

  const [loadingAI, setLoadingAI] = useState(false);

  /* =========================================================
     HANDLERS
  ========================================================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setProperty({ ...property, [e.target.name]: e.target.value });
  };

  const togglePreference = (key: string) => {
    const prefs = property.propertyPreferences || [];
    setProperty({
      ...property,
      propertyPreferences: prefs.includes(key)
        ? prefs.filter((v) => v !== key)
        : [...prefs, key],
    });
  };

  const toggleAmenity = (amenity: string) => {
    const arr = property.amenities || [];
    setProperty({
      ...property,
      amenities: arr.includes(amenity)
        ? arr.filter((x) => x !== amenity)
        : [...arr, amenity],
    });
  };

  /* =========================================================
     PHOTO HANDLERS
  ========================================================= */
  const onDrop = (acceptedFiles: File[]) => {
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

  const removePhoto = (index: number) => {
    const photo = photos[index];
    if (photo?.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  /* =========================================================
     AI DESCRIPTION
  ========================================================= */
  const handleGenerateDescription = async () => {
    setLoadingAI(true);

    const p = property;
    const prompt = `
Create a compelling, concise property description (under 150 words) based on:
Name: ${p.propertyName}
Type: ${p.propertyType}
Amenities: ${p.amenities?.join(", ") || "None"}
Address: ${p.street}, ${p.brgyDistrict}, ${p.city}, ${p.zipCode}, ${p.province}
Floor Area: ${p.floorArea} sqm
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
            {
              role: "system",
              content:
                "You are a real estate assistant. Write concise, appealing property descriptions.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) setProperty({ ...property, propDesc: text });
    } catch {
      alert("Failed to generate description");
    }

    setLoadingAI(false);
  };

  /* =========================================================
     MAP CALLBACK
  ========================================================= */
  const mapSetFields = (data: any) => {
    if (!data) return;

    setProperty({
      ...property,
      street: data.street || "",
      brgyDistrict: data.brgyDistrict || "",
      city: data.city || "",
      province: data.province || "",
      zipCode: data.zipCode || "",
      latitude: data.latitude,
      longitude: data.longitude,
    });

    setCoords({ lat: data.latitude, lng: data.longitude });
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ===== PROPERTY TYPE ===== */}
      <div id="property-type-section">
        <SectionHeader
          number={1}
          icon={Building2}
          title="Property Type"
          subtitle="Select the type that best describes your property"
          required
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {PROPERTY_TYPES.map((type) => {
            const active = property.propertyType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setProperty({ ...property, propertyType: type.value })
                }
                className={`relative p-3 sm:p-4 rounded-xl transition-all ${
                  active
                    ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                    : "bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                {active && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
                <span className="text-2xl sm:text-3xl block mb-1">
                  {type.icon}
                </span>
                <p className="text-xs sm:text-sm font-semibold">{type.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== PROPERTY NAME ===== */}
      <div id="property-name-section">
        <SectionHeader
          number={2}
          icon={Building2}
          title="Property Name"
          subtitle="Give your property a memorable name"
          required
        />
        <InputField
          label="Property Name"
          name="propertyName"
          value={property.propertyName}
          onChange={handleChange}
          placeholder="e.g., Sunshine Residences"
          required
        />
      </div>

      {/* ===== LOCATION (MAP) ===== */}
      <div id="location-section">
        <SectionHeader
          number={3}
          icon={MapPin}
          title="Property Location"
          subtitle="Search, click on map, or use your current location"
          required
        />

        {/* Map Container */}
        <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm h-64 sm:h-80 lg:h-96 relative z-0 mb-4">
          <PropertyMapWrapper
            coordinates={
              coords.lat && coords.lng ? [coords.lat, coords.lng] : null
            }
            setFields={mapSetFields}
          />
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InputField
            label="Street"
            name="street"
            value={property.street}
            onChange={handleChange}
            placeholder="Street address"
            required
          />
          <InputField
            label="Barangay / District"
            name="brgyDistrict"
            value={property.brgyDistrict}
            onChange={handleChange}
            placeholder="Barangay"
            readOnly
          />
          <InputField
            label="City / Municipality"
            name="city"
            value={property.city}
            onChange={handleChange}
            placeholder="City"
            required
          />
          <InputField
            label="Province"
            name="province"
            value={property.province}
            onChange={handleChange}
            placeholder="Province"
            readOnly
          />
          <InputField
            label="ZIP Code"
            name="zipCode"
            value={property.zipCode}
            onChange={handleChange}
            placeholder="ZIP Code"
            required
          />
        </div>
      </div>

      {/* ===== AMENITIES ===== */}
      <div id="amenities-section">
        <SectionHeader
          number={4}
          icon={CheckCircle}
          title="Amenities"
          subtitle="Select all amenities available in your property"
        />
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 sm:p-4 border border-gray-200 rounded-xl">
          <AmenitiesSelector
            selectedAmenities={property.amenities || []}
            onAmenityChange={toggleAmenity}
          />
        </div>
      </div>

      {/* ===== DESCRIPTION ===== */}
      <div id="description-section">
        <SectionHeader
          number={5}
          icon={FileText}
          title="Description"
          subtitle="Write a compelling description or let AI help you"
          required
        />
        <div className="space-y-3">
          <textarea
            name="propDesc"
            rows={5}
            onChange={handleChange}
            value={property.propDesc || ""}
            placeholder="Describe what makes your property special..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={loadingAI}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
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
      </div>

      {/* ===== FLOOR AREA ===== */}
      <div id="floor-area-section">
        <SectionHeader
          number={6}
          icon={Ruler}
          title="Property Size"
          subtitle="Total floor area of your property"
          required
        />
        <div className="max-w-xs">
          <InputField
            label="Floor Area (sqm)"
            name="floorArea"
            value={property.floorArea}
            onChange={handleChange}
            placeholder="e.g., 150"
            type="number"
            required
          />
        </div>
      </div>

      {/* ===== PREFERENCES ===== */}
      <div id="preferences-section">
        <SectionHeader
          number={7}
          icon={Heart}
          title="Property Preferences"
          subtitle="Set rules and preferences for tenants"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {PROPERTY_PREFERENCES.map((pref) => {
            const Icon = pref.icon;
            const active = property.propertyPreferences?.includes(pref.key);
            return (
              <button
                key={pref.key}
                type="button"
                onClick={() => togglePreference(pref.key)}
                className={`relative p-3 sm:p-4 rounded-xl transition-all ${
                  active
                    ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                {active && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
                <Icon className="text-xl sm:text-2xl mb-1 mx-auto" />
                <p className="text-xs sm:text-sm font-semibold">{pref.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== UTILITY BILLING ===== */}
      <div id="utility-billing-section">
        <SectionHeader
          number={8}
          icon={Zap}
          title="Utility Billing"
          subtitle="How are utilities billed to tenants?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
              <span className="text-blue-500">💧</span> Water Billing
              <span className="text-red-500">*</span>
            </label>
            <select
              name="waterBillingType"
              onChange={handleChange}
              value={property.waterBillingType || ""}
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

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
              <span className="text-amber-500">⚡</span> Electricity Billing
              <span className="text-red-500">*</span>
            </label>
            <select
              name="electricityBillingType"
              onChange={handleChange}
              value={property.electricityBillingType || ""}
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

        {/* Info Box */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold">Billing Types:</p>
              <ul className="mt-1 space-y-0.5">
                <li>
                  <strong>Submetered:</strong> Each unit has its own meter,
                  billed based on usage
                </li>
                <li>
                  <strong>Inclusive:</strong> Utilities included in rent
                </li>
                <li>
                  <strong>Fixed:</strong> Fixed monthly utility fee
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PHOTOS ===== */}
      <div id="photos-section">
        <SectionHeader
          number={9}
          icon={ImagePlus}
          title="Property Photos"
          subtitle="Add photos to showcase your property (min 3 required)"
          required
        />

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 sm:p-8 rounded-xl cursor-pointer transition-all ${
            isDragActive
              ? "border-blue-500 bg-blue-50 shadow-inner"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
              {isDragActive ? "Drop images here" : "Drag & drop images"}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              or click to browse • PNG, JPG up to 10MB
            </p>
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">
                {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
              </p>
              {photos.length < 3 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Add at least 3 photos
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo: any, index: number) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200"
                >
                  <img
                    src={photo.preview}
                    alt={`Property photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Photo Number */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-md">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
