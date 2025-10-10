"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { z } from "zod";
import furnishingTypes from "../../../../../../../constant/furnishingTypes";
import unitTypes from "../../../../../../../constant/unitTypes";

import LandlordLayout from "../../../../../../../components/navigation/sidebar-landlord";
import AmenitiesSelector from "../../../../../../../components/landlord/properties/unitAmenities";

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
    unitType:'',
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
            `/api/propertyListing/getPropDetailsById?id=${propertyId}`
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
    const { name, type, value } = e.target;

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
      });
      return;
    }

    const confirmSubmit = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to submit this unit listing?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, submit it!",
    });

    if (!confirmSubmit.isConfirmed) return;

    setLoading(true);
    const propURL = `/pages/landlord/property-listing/view-unit/${propertyId}`;

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

      Swal.fire("Success!", "Unit created successfully!", "success").then(() => {
        router.replace(propURL);
      });
    } catch (error: any) {
      console.error("Error creating unit:", error);
      Swal.fire("Error!", `Error creating unit: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => router.back();

  return (
      <LandlordLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 flex-shrink-0">
                  <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                    Create New Unit
                  </h1>
                  <p className="text-blue-100 mt-1 text-sm sm:text-base truncate">
                    Adding unit to{" "}
                    <span className="font-semibold">{propertyName}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <form
                  onSubmit={handleSubmit}
                  className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8"
              >
                {/* Basic Information Section */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      1
                    </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Basic Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Unit Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Unit Name <span className="text-red-500">*</span>
                      </label>
                      <input
                          type="text"
                          name="unitName"
                          value={formData.unitName}
                          onChange={handleChange}
                          placeholder="e.g., Unit 101, Studio A"
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base ${
                              unitNameError
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                          }`}
                      />
                      {unitNameError && (
                          <p className="text-xs text-red-500 mt-1">
                            {unitNameError}
                          </p>
                      )}
                    </div>

                    {/* Unit Size */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Unit Size <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                            type="number"
                            name="unitSize"
                            value={formData.unitSize}
                            onChange={handleChange}
                            placeholder="25"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                        sqm
                      </span>
                      </div>
                    </div>


                    {/* Unit Type */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Unit Type <span className="text-red-500">*</span>
                      </label>
                      <select
                          name="unitType"
                          value={formData.unitType || ""}
                          onChange={handleChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
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

                  </div>

                  {/* Rent Amount */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Monthly Rent Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative max-w-full sm:max-w-md">
                    <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                      ₱
                    </span>
                      <input
                          type="number"
                          name="rentAmt"
                          value={formData.rentAmt}
                          onChange={handleChange}
                          placeholder="5000"
                          min={0}
                          className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      2
                    </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Unit Features
                    </h2>
                  </div>

                  {/* Furnishing */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Furnishing Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="furnish"
                        value={formData.furnish}
                        onChange={handleChange}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
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
                </div>

                {/* Amenities */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <label className="block text-sm font-semibold text-gray-700">
                      Amenities
                    </label>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <AmenitiesSelector
                        selectedAmenities={formData.amenities}
                        onAmenityChange={handleAmenityChange}
                    />
                  </div>
                </div>

                {/* Photos Section */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      3
                    </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Unit Photos <span className="text-red-500">*</span>
                    </h2>
                  </div>

                  {/* Dropzone */}
                  <div
                      {...getRootProps()}
                      className={`relative border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 transition-all duration-300 cursor-pointer group ${
                          isDragActive
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                  >
                    <input {...getInputProps()} />
                    <div className="text-center space-y-3 sm:space-y-4">
                      <div
                          className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
                              isDragActive
                                  ? "bg-blue-100"
                                  : "bg-gray-100 group-hover:bg-blue-50"
                          }`}
                      >
                        <svg
                            className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300 ${
                                isDragActive
                                    ? "text-blue-600"
                                    : "text-gray-400 group-hover:text-blue-500"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                            className={`text-base sm:text-lg font-medium transition-colors duration-300 ${
                                isDragActive ? "text-blue-600" : "text-gray-700"
                            }`}
                        >
                          {isDragActive
                              ? "Drop photos here"
                              : "Upload unit photos"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Drag and drop or click to select multiple images
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supported formats: JPG, PNG, GIF (Max 10MB each)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Photo Previews */}
                  {photos.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Uploaded Photos ({photos.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                          {photos.map((photo, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                  <Image
                                      src={URL.createObjectURL(photo)}
                                      alt={`Unit photo ${index + 1}`}
                                      width={200}
                                      height={200}
                                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  />
                                </div>
                                <button
                                    type="button"
                                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 hover:bg-red-600 text-white p-1 sm:p-1.5 rounded-full text-xs transition-colors duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                                    onClick={() => {
                                      const newPhotos = [...photos];
                                      newPhotos.splice(index, 1);
                                      setPhotos(newPhotos);
                                    }}
                                >
                                  <svg
                                      className="w-3 h-3"
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
                          ))}
                        </div>
                      </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200">
                  <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 sm:flex-none sm:order-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none text-sm sm:text-base"
                  >
                    {loading ? "Creating Unit..." : "Create Unit"}
                  </button>

                  <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 sm:flex-none sm:order-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </LandlordLayout>
  );
}
