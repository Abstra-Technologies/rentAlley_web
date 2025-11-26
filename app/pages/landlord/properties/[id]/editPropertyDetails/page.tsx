"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { StepOneEdit } from "@/components/landlord/properties/editProperty/stepOne";
import { X, Check, Loader2 } from "lucide-react";
import axios from "axios";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";

export default function EditProperty() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;

  const [loading, setLoading] = useState(false);
  const { fetchSession, user, admin } = useAuthStore();
  const { setProperty, setPhotos } = useEditPropertyStore();

  // Session check
  useEffect(() => {
    if (!user && !admin) fetchSession();
  }, [user, admin]);

  // Fetch property details
  useEffect(() => {
    if (!propertyId) return;

    axios
      .get(`/api/propertyListing/editProperty?property_id=${propertyId}`)
      .then((res) => {
        if (res.data.length > 0) {
          const propertyData = res.data[0];
          setProperty(propertyData);
          setPhotos(propertyData.photos || []);
        } else {
          Swal.fire({
            title: "Not Found",
            text: "Property does not exist.",
            icon: "warning",
          });
          router.push("/pages/landlord/property-listing");
        }
      })
      .catch((err) => {
        console.error("Failed to load property data:", err);
        Swal.fire({
          title: "Error",
          text: "Unable to load property details.",
          icon: "error",
        });
        router.push("/pages/landlord/property-listing");
      });
  }, [propertyId]);

  // SUBMIT HANDLER
  const handleSubmit = async () => {
    const { property, photos } = useEditPropertyStore.getState();

    // Basic validation
    if (
      !property.propertyName ||
      !property.street ||
      !property.brgyDistrict ||
      !property.city ||
      !property.province ||
      !property.zipCode
    ) {
      return Swal.fire({
        title: "Missing Information",
        text: "Please complete all required fields.",
        icon: "warning",
      });
    }

    const result = await Swal.fire({
      title: "Save Changes?",
      text: "Do you want to update this property?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, update it!",
    });

    if (!result.isConfirmed) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(property));

      // Upload new photos only
      photos
        .filter((p) => p.isNew && p.file)
        .forEach((p) => formData.append("files", p.file));

      await axios.put(
        `/api/propertyListing/updatePropertyDetails?property_id=${propertyId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Swal.fire({
        title: "Updated!",
        text: "Your property has been updated successfully.",
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        router.replace("/pages/landlord/property-listing");
      });
    } catch (error) {
      console.error("Error updating property:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update property. Please try again.",
        icon: "error",
      });
    }

    setLoading(false);
  };

  // CANCEL
  const handleCancel = () => {
    Swal.fire({
      title: "Discard Changes?",
      text: "Any unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    }).then((res) => {
      if (res.isConfirmed)
        router.push(`/pages/landlord/properties/${propertyId}`);
    });
  };

  const propertyName =
    useEditPropertyStore.getState().property?.propertyName || "Loading...";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Edit Property:{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {propertyName}
            </span>
          </h1>
          <p className="text-sm text-gray-600">Update your property details</p>
        </div>

        {/* FULL PAGE FORM (Step 1 only) */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 mb-6">
          <div className="p-5 md:p-6">
            <StepOneEdit propertyId={propertyId} />
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden sticky bottom-4 md:static">
          <div className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              {/* Cancel */}
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-xl transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>

              {/* Save */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Update Property</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
