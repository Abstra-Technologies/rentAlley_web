"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { MAINTENANCE_CATEGORIES } from "@/constant/maintenanceCategories";

import {
  WrenchScrewdriverIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  HomeIcon,
  BuildingOffice2Icon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { BackButton } from "../navigation/backButton";

const maintenanceSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
});

export default function MaintenanceRequestForm() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id");

  const [assetId, setAssetId] = useState("");
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ==========================================================================
       FETCH ASSET DETAILS
    ========================================================================== */
  useEffect(() => {
    if (!assetId.trim()) {
      setAssetDetails(null);
      return;
    }

    const fetchAsset = async () => {
      try {
        setLoadingAsset(true);
        const res = await axios.get(
          `/api/landlord/properties/assets/detailed?asset_id=${assetId}`
        );
        setAssetDetails(res.data);
      } catch {
        setAssetDetails(null);
        Swal.fire({
          icon: "error",
          title: "Asset Not Found",
          text: "No asset found with this code.",
        });
      } finally {
        setLoadingAsset(false);
      }
    };
    fetchAsset();
  }, [assetId]);

  /* ==========================================================================
       FILE UPLOAD
    ========================================================================== */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const valid = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setPhotos((prev) => [...prev, ...valid]);
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* ==========================================================================
       SUBMIT
    ========================================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = maintenanceSchema.safeParse({
      category: selectedCategory,
      description,
    });

    if (!validation.success) {
      const formatted = validation.error.format();
      setErrors({
        category: formatted.category?._errors[0],
        description: formatted.description?._errors[0],
      });

      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });

      setIsSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("agreement_id", agreement_id || "");
      fd.append("category", selectedCategory);
      fd.append("subject", selectedCategory);
      fd.append("description", description);
      fd.append("is_emergency", isEmergency ? "1" : "0");
      fd.append("user_id", user?.user_id || "");

      if (assetId.trim()) fd.append("asset_id", assetId);
      photos.forEach((p) => fd.append("photos", p));

      const res = await axios.post("/api/maintenance/createMaintenance", fd);

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Request Submitted!",
        }).then(() => {
          router.push(`/pages/tenant/maintenance?agreement_id=${agreement_id}`);
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: err.response?.data?.error || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==========================================================================
       UI
    ========================================================================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="h-full px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <BackButton label="Back to Requests" />

          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 mt-4 sm:mt-6 overflow-hidden">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 sm:px-6 py-6 sm:py-8 text-white">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <WrenchScrewdriverIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    Maintenance Request
                  </h1>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">
                    Submit a request and we'll handle it right away.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 md:p-8 space-y-6"
            >
              {/* ASSET CODE */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Asset Code / ID
                </label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="Enter asset code (optional)"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ASSET DETAILS */}
              {loadingAsset && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-blue-700 text-sm font-medium">
                    Loading asset details...
                  </p>
                </div>
              )}

              {assetDetails && (
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 space-y-3">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900 text-base sm:text-lg">
                    <WrenchIcon className="w-5 h-5 text-blue-600" />
                    Asset Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Name:</span>
                      <p className="font-semibold text-gray-900">
                        {assetDetails.asset_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">
                        Category:
                      </span>
                      <p className="font-semibold text-gray-900">
                        {assetDetails.category || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Model:</span>
                      <p className="font-semibold text-gray-900">
                        {assetDetails.model || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">
                        Serial No:
                      </span>
                      <p className="font-semibold text-gray-900">
                        {assetDetails.serial_number || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-gray-600 font-medium">
                      Assigned To:
                    </span>
                    {assetDetails.unit_name ? (
                      <p className="text-blue-600 font-semibold inline-flex items-center gap-1 ml-2">
                        <HomeIcon className="w-4 h-4" />{" "}
                        {assetDetails.unit_name}
                      </p>
                    ) : (
                      <p className="text-gray-600 font-semibold inline-flex items-center gap-1 ml-2">
                        <BuildingOffice2Icon className="w-4 h-4" />
                        Property-Level
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* CATEGORY GRID */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Problem Type *
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MAINTENANCE_CATEGORIES.map((item) => {
                    const isActive = selectedCategory === item.value;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedCategory(item.value)}
                        className={`h-24 sm:h-28 flex flex-col items-center justify-center rounded-xl border-2 shadow-sm transition-all hover:shadow-md ${
                          isActive
                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-emerald-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <Icon
                          className={`w-7 h-7 sm:w-8 sm:h-8 mb-2 ${
                            isActive ? "text-blue-600" : "text-gray-600"
                          }`}
                        />
                        <span
                          className={`text-xs sm:text-sm font-semibold px-2 text-center ${
                            isActive ? "text-blue-700" : "text-gray-700"
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {errors.category && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    <span>{errors.category}</span>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Description *
                </label>

                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className={`w-full p-4 border-2 rounded-xl text-sm resize-none transition-all focus:ring-2 focus:ring-blue-500 ${
                    errors.description
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />

                {errors.description && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    <span>{errors.description}</span>
                  </div>
                )}
              </div>

              {/* EMERGENCY */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Emergency Request?
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Mark if this requires immediate attention
                    </p>
                  </div>

                  <label className="inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isEmergency}
                      onChange={() => setIsEmergency(!isEmergency)}
                    />
                    <div className="relative w-11 h-6 bg-gray-300 peer-checked:bg-red-500 rounded-full transition-colors shadow-inner">
                      <span
                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                          isEmergency ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </div>
                  </label>
                </div>
              </div>

              {/* PHOTO UPLOAD */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Photos (optional)
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all ${
                    dragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <CloudArrowUpIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-gray-700 text-sm font-semibold">
                      Click or drag photos to upload
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Support for PNG, JPG, JPEG
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Upload ${i + 1}`}
                          className="w-full h-24 sm:h-28 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 sm:py-4 rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-sm sm:text-base font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
