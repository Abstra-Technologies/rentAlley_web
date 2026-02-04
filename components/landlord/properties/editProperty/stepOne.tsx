"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import AmenitiesSelector from "@/components/landlord/createProperty/amenities-selector";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  Camera,
  X,
  Sparkles,
  Building2,
  MapPin,
  FileText,
  Ruler,
  Heart,
  Zap,
  ImagePlus,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const PropertyMapWrapper = dynamic(
  () => import("@/components/landlord/createProperty/propertyMapWrapper"),
  { ssr: false, loading: () => <MapSkeleton /> },
);

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
}: {
  number: number;
  icon: any;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-4">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/25 flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            {title}
          </h3>
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
  error,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
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
            : error
              ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              : "border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        }`}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Main Component
export const StepOneEdit = ({ propertyId }: { propertyId: any }) => {
  const { property, setProperty, photos, setPhotos } = useEditPropertyStore();

  const [coords, setCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: null,
    lng: null,
  });
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     FETCH PROPERTY DETAILS
  ========================================================= */
  useEffect(() => {
    if (!propertyId) return;

    let mounted = true;

    (async () => {
      try {
        const res = await fetch(
          `/api/propertyListing/editProperty?property_id=${propertyId}`,
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
     FETCH EXISTING PHOTOS
  ========================================================= */
  useEffect(() => {
    if (!propertyId) return;

    let mounted = true;

    (async () => {
      try {
        const res = await fetch(
          `/api/propertyListing/propertyPhotos?property_id=${propertyId}`,
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
     HANDLERS
  ========================================================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const list = property.amenities || [];
    setProperty({
      ...property,
      amenities: list.includes(amenity)
        ? list.filter((a: string) => a !== amenity)
        : [...list, amenity],
    });
  };

  const togglePreference = (key: string) => {
    const list = property.propertyPreferences || [];
    setProperty({
      ...property,
      propertyPreferences: list.includes(key)
        ? list.filter((x: string) => x !== key)
        : [...list, key],
    });
  };

  /* =========================================================
     PHOTO HANDLERS
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
      if (!photo.isNew && photo.photo_id) {
        await axios.delete("/api/propertyListing/deletPropertyPhotos", {
          data: {
            photo_id: photo.photo_id,
            property_id: propertyId,
          },
        });
        setPhotos((prev: any[]) =>
          prev.filter((p) => p.photo_id !== photo.photo_id),
        );
        return;
      }
      setPhotos((prev: any[]) =>
        prev.filter((p) => p.preview !== photo.preview),
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
                "You write concise, appealing property descriptions for rental listings in the Philippines. Keep it under 150 words.",
            },
            {
              role: "user",
              content: `Generate a rental property description for:
Name: ${property.propertyName}
Type: ${property.propertyType}
Amenities: ${property.amenities?.join(", ")}
Location: ${property.street}, ${property.city}
Floor Area: ${property.floorArea} sqm`,
            },
          ],
        }),
      });

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

  /* =========================================================
     SKELETON LOADING
  ========================================================= */
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Property Type Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-300 rounded-xl"></div>
            <div className="h-5 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 sm:h-24 bg-gray-200 rounded-xl"
              ></div>
            ))}
          </div>
        </div>

        {/* Map Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-300 rounded-xl"></div>
            <div className="h-5 bg-gray-300 rounded w-40"></div>
          </div>
          <div className="h-64 sm:h-80 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Fields Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>

        {/* Description Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-300 rounded-xl"></div>
            <div className="h-5 bg-gray-300 rounded w-28"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */
  return (
    <div className="space-y-8">
      {/* ===== PROPERTY TYPE ===== */}
      <div>
        <SectionHeader
          number={1}
          icon={Building2}
          title="Property Type"
          subtitle="Select the type that best describes your property"
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
      <div>
        <SectionHeader
          number={2}
          icon={Building2}
          title="Property Name"
          subtitle="Give your property a memorable name"
        />
        <InputField
          label="Property Name"
          name="propertyName"
          value={property.propertyName}
          onChange={handleChange}
          placeholder="e.g., Sunrise Apartment Complex"
          required
        />
      </div>

      {/* ===== LOCATION (MAP) ===== */}
      <div>
        <SectionHeader
          number={3}
          icon={MapPin}
          title="Property Location"
          subtitle="Search, click on map, or use your current location"
        />

        {/* Map Container */}
        <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm h-72 sm:h-96 relative z-0 mb-4">
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
            }}
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
          />
        </div>
      </div>

      {/* ===== AMENITIES ===== */}
      <div>
        <SectionHeader
          number={4}
          icon={CheckCircle}
          title="Amenities"
          subtitle="Select all amenities available in your property"
        />
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 border border-gray-200 rounded-xl">
          <AmenitiesSelector
            selectedAmenities={property.amenities || []}
            onAmenityChange={toggleAmenity}
          />
        </div>
      </div>

      {/* ===== DESCRIPTION ===== */}
      <div>
        <SectionHeader
          number={5}
          icon={FileText}
          title="Description"
          subtitle="Write a compelling description or let AI help you"
        />
        <div className="space-y-3">
          <textarea
            name="description"
            rows={5}
            onChange={handleChange}
            value={property.description || ""}
            placeholder="Describe what makes your property special..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
          <button
            type="button"
            onClick={generateDescription}
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
      <div>
        <SectionHeader
          number={6}
          icon={Ruler}
          title="Property Size"
          subtitle="Total floor area of your property"
        />
        <div className="max-w-xs">
          <InputField
            label="Floor Area (sqm)"
            name="floorArea"
            value={property.floorArea}
            onChange={handleChange}
            placeholder="e.g., 150"
            type="number"
          />
        </div>
      </div>

      {/* ===== PREFERENCES ===== */}
      <div>
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
      <div>
        <SectionHeader
          number={8}
          icon={Zap}
          title="Utility Billing"
          subtitle="How are utilities billed to tenants?"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
              <span className="text-blue-500">💧</span> Water Billing
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

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
              <span className="text-amber-500">⚡</span> Electricity Billing
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
      <div>
        <SectionHeader
          number={9}
          icon={ImagePlus}
          title="Property Photos"
          subtitle="Add photos to showcase your property (min 3 recommended)"
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
                  key={photo.photo_id ?? photo.preview}
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
                    onClick={() => removePhoto(photo)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Photo Number */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-md">
                    {index + 1}
                  </div>

                  {/* New Badge */}
                  {photo.isNew && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-md font-medium">
                      New
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
