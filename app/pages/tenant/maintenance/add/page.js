"use client";

import { useState } from "react";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";
import { MAINTENANCE_CATEGORIES } from "../../../../../constant/maintenanceCategories";
import Swal from "sweetalert2";
import { z } from "zod";
import { io } from "socket.io-client";

const maintenanceRequestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  photos: z.array(z.instanceof(File)).min(1, "At least one photo is required"),
});

export default function MaintenanceRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
    { autoConnect: true }
  );

  const handleFileChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        title: "Validation Error",
        text: "Please fill in all required fields correctly.",
      });

      return;
    }

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
      const maintenanceRes = await axios.post("/api/maintenance/create", {
        tenant_id: user.tenant_id,
        subject,
        description,
        user_id: user?.user_id,
        category: selectedCategory,
      });

      console.log("Maintenance Request Response:", maintenanceRes);

      const requestId = maintenanceRes.data.request_id;

      // Notify the landlord
      await axios.post("/api/maintenance/notify-landlord", {
        request_id: requestId,
      });

      // Upload photos if available
      if (photos.length > 0) {
        const formData = new FormData();
        formData.append("request_id", requestId);

        console.log("Uploading Photos:", photos);

        photos.forEach((photo) => {
          formData.append("photos", photo);
        });

        await axios.post("/api/maintenance/uploadPhotos", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      Swal.fire({
        icon: "success",
        title: "Request Submitted",
        text: "Your maintenance request has been submitted successfully!",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        router.push("/pages/tenant/maintenance");
      });
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong. Please try again later.",
      });
    }
  };

  return (
    <TenantLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-2xl">
          <h2 className="text-2xl font-semibold text-center mb-4 text-blue-600">
            Submit Maintenance Request
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-gray-700 font-medium">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {MAINTENANCE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm">{errors.category}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-gray-700 font-medium">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter subject"
              />
              {errors.subject && (
                <p className="text-red-500 text-sm">{errors.subject}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows="4"
                placeholder="Describe the issue"
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
            </div>

            {/* Upload Photos */}
            <div>
              <label className="block text-gray-700 font-medium">
                Upload Photos
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded-lg"
              />
              {errors.photos && (
                <p className="text-red-500 text-sm">{errors.photos}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </TenantLayout>
  );
}
