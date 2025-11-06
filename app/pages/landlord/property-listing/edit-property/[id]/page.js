"use client";
import React, { useState, useEffect } from "react";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import { useRouter, useParams } from "next/navigation";
import StepCounter4 from "@/components/landlord/properties/editProperty/stepCounter";
import { StepOneEdit } from "@/components/landlord/properties/editProperty/stepOne";
import { StepTwoEdit } from "@/components/landlord/properties/editProperty/stepTwo";
import { StepThreeEdit } from "@/components/landlord/properties/editProperty/stepThree";
import { StepFourEdit } from "@/components/landlord/properties/editProperty/stepFour";
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

  const {
    setProperty,
    setPhotos,
  } = useEditPropertyStore();

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
            Swal.fire("Error", "Unable to load property details.", "error");
            router.push("/pages/landlord/property-listing");
          });
    }
  }, [propertyId]);

  const validateStep = (step) => {
    const { property, photos } =
        useEditPropertyStore.getState();

    if (step === 1) {
      if (
          !property.propertyName ||
          !property.street ||
          !property.brgyDistrict ||
          !property.city ||
          !property.province ||
          !property.zipCode
      ) {
        Swal.fire(
            "Missing Details",
            "Please fill in all property details before proceeding.",
            "warning"
        );
        return false;
      }

      const zipCodePattern = /^\d{4}$/;
      if (!zipCodePattern.test(property.zipCode)) {
        Swal.fire(
            "Invalid ZIP Code",
            "Zip Code must be exactly 4 digits.",
            "error"
        );
        return false;
      }
    }

    if (step === 3) {
      if (photos.length === 0 || photos.length < 3) {
        Swal.fire(
            "Insufficient Photos",
            "Please upload at least three property photos.",
            "warning"
        );
        return false;
      }

      // if (!property.propDesc || property.propDesc.trim().length === 0) {
      //   Swal.fire("Missing Description", "Please enter the description of the property", "error");
      //   return false;
      // }

      if (!property.floorArea || property.floorArea <= 0) {
        Swal.fire("Missing Floor Area", "Please enter the floor area of the property", "error");
        return false;
      }

      if (!property.minStay || property.minStay <= 0) {
        Swal.fire(
            "Missing Minimum Stay",
            "Please enter the minimum stay duration (in months).",
            "error"
        );
        return false;
      }

      if (!property.waterBillingType || property.waterBillingType.trim() === "") {
        Swal.fire(
            "Missing Water Utility Billing Type",
            "Please select a utility billing type.",
            "error"
        );
        return false;
      }

      if (!property.electricityBillingType || property.electricityBillingType.trim() === "") {
        Swal.fire(
            "Missing Eelctricity Utility Billing Type",
            "Please select a utility billing type.",
            "error"
        );
        return false;
      }

      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
      for (let photo of photos) {
        if (!allowedImageTypes.includes(photo.file?.type)) {
          Swal.fire(
              "Invalid File Type",
              "Only image files (JPEG, PNG, WEBP) are allowed for property photos.",
              "error"
          );
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

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save these changes?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save it!",
    }).then(async (result) => {
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

        Swal.fire("Saved!", "Your property has been updated.", "success").then(() => {
          router.replace("/pages/landlord/property-listing");
        });
      } catch (error) {
        console.error("Error updating property:", error);
        Swal.fire("Error", "Failed to update property. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleCancel = () => {
    router.push("/pages/landlord/property-listing");
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

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="flex">
          <main className="flex-1 p-4 sm:p-8">
            {/* Header */}
            <h1 className="mt-4 text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
              Edit Property{" "}
              <span className="bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            {useEditPropertyStore.getState().property?.propertyName || ""}
          </span>
            </h1>

            {/* Step Counter */}
            <StepCounter4 currentStep={step} />

            {/* Main Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 mt-6">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mt-8">
                <div className="flex flex-wrap gap-3">
                  {step > 1 && (
                      <button
                          onClick={prevStep}
                          className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-all"
                      >
                        ← Back
                      </button>
                  )}

                  <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>

                {step < 4 ? (
                    <button
                        onClick={nextStep}
                        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-md hover:from-blue-700 hover:to-emerald-700 transition-all shadow-sm"
                    >
                      Next →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-md hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm"
                    >
                      Update
                    </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
  );

}
