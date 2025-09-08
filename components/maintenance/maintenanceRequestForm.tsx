"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import useAuth from "../../hooks/useSession";
import { useRouter, useSearchParams } from "next/navigation";
import TenantLayout from "../../components/navigation/sidebar-tenant";
import { MAINTENANCE_CATEGORIES } from "../../constant/maintenanceCategories";
import Swal from "sweetalert2";
import { z } from "zod";
import { io } from "socket.io-client";
import useAuthStore from "@/zustand/authStore";
import { BackButton } from "../navigation/backButton";

const maintenanceRequestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  photos: z.array(z.instanceof(File)).min(1, "At least one photo is required"),
});

type ValidationErrors = {
  category?: string;
  subject?: string;
  description?: string;
  photos?: string;
};

export default function MaintenanceRequestForm() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id");

  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
    { autoConnect: true }
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles]);
      setErrors((prev) => ({ ...prev, photos: undefined }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      setPhotos((prev) => [...prev, ...newFiles]);
      setErrors((prev) => ({ ...prev, photos: undefined }));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      plumbing: "🚿",
      electrical: "⚡",
      hvac: "🌡️",
      appliance: "🔌",
      structural: "🏗️",
      cleaning: "🧽",
      pest_control: "🐛",
      security: "🔒",
      other: "🔧",
    };
    return iconMap[category.toLowerCase()] || "🔧";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      category: selectedCategory,
      subject,
      description,
      photos,
    };

    const validation = maintenanceRequestSchema.safeParse(formData);

    if (!validation.success) {
      const formattedErrors = validation.error.format();
      setErrors({
        category: formattedErrors.category?._errors[0],
        subject: formattedErrors.subject?._errors[0],
        description: formattedErrors.description?._errors[0],
        photos: formattedErrors.photos?._errors[0],
      });

      Swal.fire({
        icon: "error",
        title: "Please Complete All Fields",
        text: "Make sure to fill in all required information and upload at least one photo.",
        confirmButtonColor: "#ef4444",
      });

      setIsSubmitting(false);
      return;
    }

    // Clear any existing errors
    setErrors({});

    Swal.fire({
      title: "Submitting Request...",
      text: "Please wait while we process your maintenance request.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const maintenanceRes = await axios.post(
        "/api/maintenance/createMaintenance",
        {
          agreement_id,
          subject,
          description,
          category: selectedCategory,
        }
      );

      const requestId = maintenanceRes.data.request_id;

      if (photos.length > 0) {
        const photoForm = new FormData();
        photoForm.append("request_id", requestId);

        photos.forEach((photo) => {
          photoForm.append("photos", photo);
        });

        await axios.post(
          "/api/maintenance/createMaintenance/uploadPhotos",
          photoForm,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      Swal.fire({
        icon: "success",
        title: "Request Submitted Successfully!",
        text: "Your maintenance request has been submitted and you'll receive updates on its progress.",
        confirmButtonColor: "#10b981",
        confirmButtonText: "View My Requests",
      }).then(() => {
        router.push(`/pages/tenant/maintenance?agreement_id=${agreement_id}`);
      });
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Unable to submit your request. Please check your connection and try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TenantLayout agreement_id={agreement_id}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton label="Back to Requests" />
          </div>

          {/* Main Form Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 sm:px-8 py-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
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
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Submit Maintenance Request
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Report issues and get them resolved quickly
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span className="w-2 h-2 bg-blue-200 rounded-full"></span>
                <span>
                  Fill out the form below to submit your maintenance request
                </span>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {/* Category Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Issue Category *
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setErrors((prev) => ({ ...prev, category: undefined }));
                    }}
                    className={`w-full p-4 border-2 rounded-xl bg-white text-gray-900 font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${
                      errors.category
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option value="" disabled className="text-gray-500">
                      Choose the type of maintenance issue
                    </option>
                    {MAINTENANCE_CATEGORIES.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                        className="py-2"
                      >
                        {getCategoryIcon(category.value)} {category.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                {errors.category && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {errors.category}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setErrors((prev) => ({ ...prev, subject: undefined }));
                  }}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${
                    errors.subject
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  placeholder="Brief summary of the issue (e.g., 'Leaking faucet in kitchen')"
                />
                {errors.subject && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {errors.subject}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Detailed Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 resize-none ${
                    errors.description
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  rows={5}
                  placeholder="Please provide detailed information about the issue, including when it started, how it affects you, and any steps you've already taken..."
                />
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Be as specific as possible to help us resolve the issue
                    quickly
                  </span>
                  <span>{description.length}/1000</span>
                </div>
                {errors.description && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Photo Evidence *
                </label>
                <p className="text-sm text-gray-600">
                  Upload photos to help us understand the issue better. At least
                  one photo is required.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    dragActive
                      ? "border-blue-400 bg-blue-50"
                      : errors.photos
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                      <p className="text-lg font-medium text-gray-700">
                        Drop photos here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports: JPG, PNG, GIF (Max 10MB each)
                      </p>
                    </div>

                    <button
                      type="button"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Choose Files
                    </button>
                  </div>
                </div>

                {errors.photos && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {errors.photos}
                  </div>
                )}

                {/* Photo Preview */}
                {photos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      Uploaded Photos ({photos.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {photo.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none font-semibold text-lg flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      <span>Submit Maintenance Request</span>
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  You'll receive updates soon!
                </p>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Tips for Better Service
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Include clear, well-lit photos from multiple angles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Describe when the issue started and if it's getting worse
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Mention if the issue affects your safety or daily activities
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  We typically respond within 24 hours for non-emergency
                  requests
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
