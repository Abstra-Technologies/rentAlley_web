"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { z } from "zod";
import {
  Plus,
  Upload,
  X,
  Home,
  Ruler,
  DollarSign,
  Camera,
  Eye,
  HelpCircle,
} from "lucide-react";
import furnishingTypes from "@/constant/furnishingTypes";
import unitTypes from "@/constant/unitTypes";
import AmenitiesSelector from "@/components/landlord/properties/unitAmenities";
import DisableNavigation from "@/components/navigation/DisableNavigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import { createUnitSteps } from "@/lib/onboarding/createUnit";

// Zod validation schema
const unitSchema = z.object({
  unitName: z.string().min(1, "Unit name is required"),
  unitSize: z.string().min(1, "Unit Size is required"),
  rentAmt: z.number().min(1, "Rent amount is required"),
  furnish: z.string().min(1, "Furnishing selection is required"),
  photos: z.array(z.any()).min(1, "At least one image is required"),
});

export default function UnitListingForm() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id");
  const router = useRouter();

  const [formData, setFormData] = useState({
    property_id: propertyId || "",
    unitName: "",
    unitSize: "",
    rentAmt: "",
    furnish: "",
    amenities: [],
    unitType: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [propertyName, setPropertyName] = useState("");
  const [unitNameError, setUnitNameError] = useState("");

  // 360° States
  const [is360Enabled, setIs360Enabled] = useState(false);
  const [photo360, setPhoto360] = useState<File | null>(null);
  const [preview360, setPreview360] = useState("");

  // Initialize onboarding
  const { startTour } = useOnboarding({
    tourId: "create-unit",
    steps: createUnitSteps,
    autoStart: true, // Auto-start on first visit
  });

  useEffect(() => {
    const fetchPropertyName = async () => {
      if (!propertyId) return;
      try {
        const res = await fetch(
          `/api/propertyListing/getPropDetailsById?property_id=${propertyId}`
        );
        if (!res.ok) throw new Error("Failed to fetch property");
        const data = await res.json();
        setPropertyName(data.property.property_name);
      } catch {
        setPropertyName("Unknown Property");
      }
    };
    fetchPropertyName();
  }, [propertyId]);

  // Load 360 Viewer
  useEffect(() => {
    if (!preview360) return;
    import("@egjs/view360").then(({ default: Viewer }) => {
      new Viewer("#viewer360", {
        image: preview360,
        projection: "equirectangular",
        autoResize: true,
      });
    });
  }, [preview360]);

  const handleAmenityChange = (amenityName: string) => {
    setFormData((prev) => {
      const isSelected = prev.amenities.includes(amenityName);
      return {
        ...prev,
        amenities: isSelected
          ? prev.amenities.filter((a) => a !== amenityName)
          : [...prev.amenities, amenityName],
      };
    });
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "unitName" && value.trim() !== "") {
      try {
        const res = await fetch(
          `/api/unitListing/checkUnitName?property_id=${propertyId}&unitName=${encodeURIComponent(
            value.trim()
          )}`
        );
        const data = await res.json();
        setUnitNameError(
          data.exists ? "This unit name is already in use." : ""
        );
      } catch {}
    }
  };

  // Dropzone for regular photos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      setPhotos((prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = unitSchema.safeParse({
      ...formData,
      rentAmt: Number(formData.rentAmt),
      photos,
    });

    if (!result.success) {
      Swal.fire({
        title: "Validation Error",
        text: result.error.errors.map((err) => err.message).join(", "),
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const confirmSubmit = await Swal.fire({
      title: "Create Unit?",
      text: "Do you want to submit this unit listing?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, create it!",
    });

    if (!confirmSubmit.isConfirmed) return;

    setLoading(true);
    const propURL = `/pages/landlord/properties/${propertyId}`;

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, String(v)));
      photos.forEach((photo) => form.append("photos", photo));
      if (photo360) form.append("photo360", photo360);

      await axios.post("/api/unitListing/addUnit", form);

      Swal.fire({
        title: "Success!",
        text: "Unit created successfully!",
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        router.replace(propURL);
      });
    } catch (error: any) {
      Swal.fire({
        title: "Error!",
        text: `Error creating unit: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () =>
    router.replace(`/pages/landlord/properties/${propertyId}`);

  return (
    <>
      <DisableNavigation />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
        <div className="px-4 pt-20 pb-24 md:px-8 lg:px-12 xl:px-16">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Create New Unit
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Adding unit to{" "}
                    <span className="font-semibold text-gray-900">
                      {propertyName}
                    </span>
                  </p>
                </div>
              </div>

              {/* Help Button - Restart Tour */}
              <button
                onClick={startTour}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Show Guide</span>
              </button>
            </div>
          </div>

          {/* FORM CONTAINER */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
              {/* Basic Information */}
              <div className="p-5 md:p-6 space-y-5" id="basic-info-section">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                    1
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* UNIT NAME */}
                  <div className="space-y-2" id="unit-name-input">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Home className="w-4 h-4 text-blue-600" />
                      Unit Name *
                    </label>
                    <input
                      type="text"
                      name="unitName"
                      value={formData.unitName}
                      onChange={handleChange}
                      placeholder="e.g., Unit 101"
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        unitNameError
                          ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                          : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                    />
                    {unitNameError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                        {unitNameError}
                      </p>
                    )}
                  </div>

                  {/* UNIT SIZE */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      Unit Size *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="unitSize"
                        value={formData.unitSize}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-14 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="25"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        sqm
                      </span>
                    </div>
                  </div>

                  {/* UNIT TYPE */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Home className="w-4 h-4 text-blue-600" />
                      Unit Type *
                    </label>
                    <select
                      name="unitType"
                      value={formData.unitType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.75rem center",
                        backgroundSize: "1.25rem",
                      }}
                    >
                      <option value="" disabled>
                        Select unit type
                      </option>
                      {unitTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* RENT */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      Monthly Rent *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        ₱
                      </span>
                      <input
                        type="number"
                        name="rentAmt"
                        value={formData.rentAmt}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Features */}
              <div
                className="p-5 md:p-6 space-y-5 bg-gray-50/50"
                id="unit-features-section"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                    2
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Unit Features
                  </h2>
                </div>

                {/* Furnishing */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Furnishing Type *
                  </label>
                  <select
                    name="furnish"
                    value={formData.furnish}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>
                      Select furnishing type
                    </option>
                    {furnishingTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Amenities
                  </label>
                  <div className="bg-white p-4 border border-gray-200 rounded-xl">
                    <AmenitiesSelector
                      selectedAmenities={formData.amenities}
                      onAmenityChange={handleAmenityChange}
                    />
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="p-5 md:p-6 space-y-5" id="unit-photos-section">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                    3
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Unit Photos *
                  </h2>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed p-8 rounded-xl cursor-pointer transition-all ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50 shadow-inner"
                      : "border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30"
                  }`}
                >
                  <input
                    {...getInputProps({
                      accept: "image/*",
                      capture: "environment",
                    })}
                  />

                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Tap to take a photo or upload.
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>

                {/* PREVIEW */}
                {photos.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      {photos.length} photo{photos.length !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative group aspect-square">
                          <Image
                            src={URL.createObjectURL(photo)}
                            width={200}
                            height={200}
                            className="rounded-xl object-cover w-full h-full border border-gray-200"
                            alt="Unit photo"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            onClick={() => {
                              const updated = [...photos];
                              updated.splice(i, 1);
                              setPhotos(updated);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 360° Virtual View */}
              <div
                className="p-5 md:p-6 space-y-5 bg-gradient-to-br from-blue-50/30 to-emerald-50/30"
                id="virtual-view-section"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                    4
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Optional: 360° View
                  </h2>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="enable360"
                    checked={is360Enabled}
                    onChange={(e) => setIs360Enabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="enable360"
                    className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                  >
                    Enable 360° View?
                  </label>
                </div>

                {is360Enabled && (
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id="upload360"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setPhoto360(file);
                        setPreview360(URL.createObjectURL(file));
                      }}
                    />

                    <label
                      htmlFor="upload360"
                      className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Eye className="w-5 h-5" />
                      Take 360° Panoramic Photo
                    </label>

                    {preview360 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          360° Preview
                        </p>
                        <div
                          id="viewer360"
                          className="w-full h-64 border-2 border-emerald-200 rounded-xl overflow-hidden shadow-inner bg-gray-900"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-5 md:p-6 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 sm:flex-initial px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-xl transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !!unitNameError}
                    className="flex-1 px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Unit"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
