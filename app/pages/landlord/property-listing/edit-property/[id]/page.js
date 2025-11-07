"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import StepCounter4 from "@/components/landlord/properties/editProperty/stepCounter";
import { StepOneEdit } from "@/components/landlord/properties/editProperty/stepOne";
import { StepTwoEdit } from "@/components/landlord/properties/editProperty/stepTwo";
import { StepThreeEdit } from "@/components/landlord/properties/editProperty/stepThree";
import { StepFourEdit } from "@/components/landlord/properties/editProperty/stepFour";
import { ArrowLeft, ArrowRight, X, Check, Loader2 } from "lucide-react";
import axios from "axios";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";

export default function EditProperty() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { fetchSession, user, admin } = useAuthStore();

  const { setProperty, setPhotos } = useEditPropertyStore();

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  useEffect(() => {
    if (propertyId) {
      axios
        .get(`/api/propertyListing/editProperty?property_id=${propertyId}`)
        .then((res) => {
          const data = res.data;
          if (data.length > 0) {
            const propertyData = data[0];
            setProperty(propertyData);
            setPhotos(propertyData.photos || []);
          } else {
            console.warn("No property found with this ID");
          }
        })
        .catch((err) => {
          console.error("Failed to load property data:", err);
          Swal.fire({
            title: "Error",
            text: "Unable to load property details.",
            icon: "error",
            confirmButtonColor: "#ef4444",
          });
          router.push("/pages/landlord/property-listing");
        });
    }
  }, [propertyId]);

  const validateStep = () => {
    const { property, photos } = useEditPropertyStore.getState();

    if (step === 1) {
      if (
        !property.propertyName ||
        !property.street ||
        !property.brgyDistrict ||
        !property.city ||
        !property.province ||
        !property.zipCode
      ) {
        Swal.fire({
          title: "Missing Details",
          text: "Please fill in all property details before proceeding.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      const zipCodePattern = /^\d{4}$/;
      if (!zipCodePattern.test(property.zipCode)) {
        Swal.fire({
          title: "Invalid ZIP Code",
          text: "Zip Code must be exactly 4 digits.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
    }

    if (step === 3) {
      if (photos.length === 0 || photos.length < 3) {
        Swal.fire({
          title: "Insufficient Photos",
          text: "Please upload at least three property photos.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      if (!property.floorArea || property.floorArea <= 0) {
        Swal.fire({
          title: "Missing Floor Area",
          text: "Please enter the floor area of the property",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      if (!property.minStay || property.minStay <= 0) {
        Swal.fire({
          title: "Missing Minimum Stay",
          text: "Please enter the minimum stay duration (in months).",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      if (
        !property.waterBillingType ||
        property.waterBillingType.trim() === ""
      ) {
        Swal.fire({
          title: "Missing Water Utility Billing Type",
          text: "Please select a utility billing type.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      if (
        !property.electricityBillingType ||
        property.electricityBillingType.trim() === ""
      ) {
        Swal.fire({
          title: "Missing Electricity Utility Billing Type",
          text: "Please select a utility billing type.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
      for (let photo of photos) {
        if (photo.file && !allowedImageTypes.includes(photo.file?.type)) {
          Swal.fire({
            title: "Invalid File Type",
            text: "Only image files (JPEG, PNG, WEBP) are allowed for property photos.",
            icon: "error",
            confirmButtonColor: "#3b82f6",
          });
          return false;
        }
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Save Changes?",
      text: "Do you want to update this property?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setLoading(true);

    const { property, photos } = useEditPropertyStore.getState();

    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(property));

      photos
        .filter((photo) => photo.isNew && photo.file)
        .forEach((photo) => {
          formData.append("files", photo.file);
        });

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
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Discard Changes?",
      text: "Any unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, discard",
      cancelButtonText: "Continue editing",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/pages/landlord/property-listing");
      }
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepOneEdit propertyId={propertyId} />;
      case 2:
        return <StepTwoEdit />;
      case 3:
        return <StepThreeEdit propertyId={propertyId} />;
      case 4:
        return <StepFourEdit />;
      default:
        return <div>Invalid Step</div>;
    }
  };

  const propertyName =
    useEditPropertyStore.getState().property?.propertyName || "Loading...";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Proper spacing for navbar and sidebar */}
      <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
        {/* Header - Compact and clean */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Edit Property:{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {propertyName}
            </span>
          </h1>
          <p className="text-sm text-gray-600">
            Update your property details and save changes
          </p>
        </div>

        {/* Step Counter */}
        <div className="mb-6">
          <StepCounter4 currentStep={step} />
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 md:p-6">{renderStep()}</div>
        </div>

        {/* Navigation Buttons - Sticky at bottom on mobile */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky bottom-4 md:static">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Left Side: Back + Cancel */}
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-lg font-medium transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
              </div>

              {/* Right Side: Next / Update */}
              <div>
                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Update Property</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
