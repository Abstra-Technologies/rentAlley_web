"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { z } from "zod";
import { Plus, Upload, X } from "lucide-react";
import furnishingTypes from "@/constant/furnishingTypes";
import unitTypes from "@/constant/unitTypes";
import AmenitiesSelector from "@/components/landlord/properties/unitAmenities";
import DisableNavigation from "@/components/navigation/DisableNavigation";

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
      } catch (err) {
        console.error("Error fetching property name:", err);
        setPropertyName("Unknown Property");
      }
    };
    fetchPropertyName();
  }, [propertyId]);

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
          data.exists
            ? "This unit name is already in use for this property."
            : ""
        );
      } catch (err) {
        console.error("Error checking unit name:", err);
      }
    }
  };

  // Dropzone
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
      form.append("property_id", formData.property_id);
      form.append("unitName", formData.unitName);
      form.append("unitSize", formData.unitSize);
      form.append("unitType", formData.unitType);
      form.append("rentAmt", formData.rentAmt);
      form.append("furnish", formData.furnish);
      form.append("amenities", formData.amenities.join(","));
      photos.forEach((photo) => form.append("photos", photo));

      await axios.post("/api/unitListing/addUnit", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        title: "Success!",
        text: "Unit created successfully!",
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        router.replace(propURL);
      });
    } catch (error: any) {
      console.error("Error creating unit:", error);
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

  const handleCancel = () => {
    router.replace(`/pages/landlord/properties/${propertyId}`);
  };

  return (
    <>
      <DisableNavigation />

      <div className="min-h-screen bg-gray-50">
        {/* Proper spacing for navbar */}
        <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create New Unit
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Adding unit to{" "}
                  <span className="font-semibold">{propertyName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">1</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Unit Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="unitName"
                      value={formData.unitName}
                      onChange={handleChange}
                      placeholder="e.g., Unit 101, Studio A"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors text-sm ${
                        unitNameError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    {unitNameError && (
                      <p className="text-xs text-red-500">{unitNameError}</p>
                    )}
                  </div>

                  {/* Unit Size */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Size <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="unitSize"
                        value={formData.unitSize}
                        onChange={handleChange}
                        placeholder="25"
                        className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                        sqm
                      </span>
                    </div>
                  </div>

                  {/* Unit Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unitType"
                      value={formData.unitType || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
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

                  {/* Rent Amount */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Monthly Rent <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        name="rentAmt"
                        value={formData.rentAmt}
                        onChange={handleChange}
                        placeholder="5000"
                        min={0}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">2</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Unit Features
                  </h2>
                </div>

                {/* Furnishing */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Furnishing Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="furnish"
                    value={formData.furnish}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Amenities
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <AmenitiesSelector
                      selectedAmenities={formData.amenities}
                      onAmenityChange={handleAmenityChange}
                    />
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">3</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Unit Photos <span className="text-red-500">*</span>
                  </h2>
                </div>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-center space-y-3">
                    <div
                      className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isDragActive ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Upload
                        className={`w-6 h-6 ${
                          isDragActive ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-base font-medium ${
                          isDragActive ? "text-blue-600" : "text-gray-700"
                        }`}
                      >
                        {isDragActive
                          ? "Drop photos here"
                          : "Upload unit photos"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Drag and drop or click to select images
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photo Previews */}
                {photos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Uploaded Photos ({photos.length})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={URL.createObjectURL(photo)}
                              alt={`Unit photo ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                            onClick={() => {
                              const newPhotos = [...photos];
                              newPhotos.splice(index, 1);
                              setPhotos(newPhotos);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2 text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Unit..." : "Create Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
