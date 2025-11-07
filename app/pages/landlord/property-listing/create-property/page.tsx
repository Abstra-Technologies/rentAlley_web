"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepCounter from "@/components/step-counter";
import { StepOne } from "@/components/landlord/step1";
import { StepTwo } from "@/components/landlord/step2";
import { StepThree } from "@/components/landlord/step3";
import { StepFive } from "@/components/landlord/step5";
import { StepFour } from "@/components/landlord/step4";
import { ArrowLeft, ArrowRight, X, Check, Loader2 } from "lucide-react";
import axios from "axios";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";
import useSubscription from "@/hooks/landlord/useSubscription";

export default function AddNewProperty() {
  const router = useRouter();
  const [step, setStep] = useState(() => {
    const savedStep =
      typeof window !== "undefined"
        ? localStorage.getItem("addPropertyStep")
        : null;
    return savedStep ? Number(savedStep) : 1;
  });
  const { fetchSession, user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const { subscription, loadingSubscription } = useSubscription(
    user?.landlord_id
  );

  useEffect(() => {
    if (loadingSubscription || !user?.landlord_id) return;

    if (!subscription || subscription?.is_active !== 1) {
      Swal.fire({
        title: "Subscription Required",
        text: "You need an active subscription to add a property.",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        html: `
        <div style="margin-top: 20px;">
          <button id="goBackButton" 
            style="
              background-color: #3b82f6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            ">
            Go Back
          </button>
        </div>
      `,
        didOpen: () => {
          const goBackButton = document.getElementById("goBackButton");
          if (goBackButton) {
            goBackButton.addEventListener("click", () => {
              Swal.close();
              router.replace("/pages/landlord/property-listing");
            });
          }
        },
      });
    }
  }, [subscription, loadingSubscription, user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("addPropertyStep", String(step));
    }
  }, [step]);

  useEffect(() => {
    if (!user) {
      fetchSession();
    }
  }, [user]);

  const {
    property,
    photos,
    reset,
    submittedDoc,
    docType,
    indoorPhoto,
    outdoorPhoto,
    govID,
  } = usePropertyStore();

  const validateStep = () => {
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
      if (!/^\d{4}$/.test(String(property.zipCode))) {
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
      if (photos.length < 3) {
        Swal.fire({
          title: "Insufficient Photos",
          text: "Please upload at least three property photos.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (property.totalUnits != null && property.totalUnits < 0) {
        Swal.fire({
          title: "Invalid Input",
          text: "Number of units cannot be negative.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (!property.propDesc?.trim()) {
        Swal.fire({
          title: "Missing Description",
          text: "Please enter a description of the property.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (!property.floorArea || property.floorArea <= 0) {
        Swal.fire({
          title: "Missing Floor Area",
          text: "Please enter a valid floor area.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (!property.minStay || property.minStay <= 0) {
        Swal.fire({
          title: "Missing Minimum Stay",
          text: "Enter minimum stay duration (in months).",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (!property.waterBillingType?.trim()) {
        Swal.fire({
          title: "Missing Water Billing Type",
          text: "Please select a billing type.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (!property.electricityBillingType?.trim()) {
        Swal.fire({
          title: "Missing Electricity Billing Type",
          text: "Please select a billing type.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif",
        "image/bmp",
        "image/tiff",
      ];
      for (let photo of photos) {
        if (!allowedTypes.includes(photo.file?.type)) {
          Swal.fire({
            title: "Invalid File",
            text: "Only JPEG, PNG, or WEBP images are allowed.",
            icon: "error",
            confirmButtonColor: "#3b82f6",
          });
          return false;
        }
      }
    }

    if (step === 4) {
      if (
        property.rentIncreasePercent == null ||
        property.rentIncreasePercent < 0
      ) {
        Swal.fire({
          title: "Missing Rent Increase",
          text: "Enter a valid percentage (0 or higher).",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (
        property.securityDepositMonths == null ||
        property.securityDepositMonths < 0
      ) {
        Swal.fire({
          title: "Missing Security Deposit",
          text: "Enter number of months required.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (
        property.advancePaymentMonths == null ||
        property.advancePaymentMonths < 0
      ) {
        Swal.fire({
          title: "Missing Advance Payment",
          text: "Enter number of months required.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
    }

    if (step === 5) {
      if (
        !submittedDoc?.file ||
        !govID?.file ||
        !indoorPhoto ||
        !outdoorPhoto
      ) {
        Swal.fire({
          title: "Missing Documents",
          text: "Please upload all required documents.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (submittedDoc?.file.type !== "application/pdf") {
        Swal.fire({
          title: "Invalid File",
          text: `${docType.replace("_", " ")} must be a PDF.`,
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
    }

    return true;
  };

  const nextStep = () =>
    validateStep() && setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("landlord_id", String(user?.landlord_id));
      formData.append("property", JSON.stringify(property));

      photos.forEach((p) => p.file && formData.append("photos", p.file));
      formData.append("docType", docType);
      formData.append("submittedDoc", submittedDoc.file);
      formData.append("govID", govID.file);
      formData.append("indoor", indoorPhoto);
      formData.append("outdoor", outdoorPhoto);

      await axios.post("/api/propertyListing/createFullProperty", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      reset();
      Swal.fire({
        title: "Success!",
        text: "Property listing submitted successfully.",
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        localStorage.removeItem("addPropertyStep");
        router.replace("/pages/landlord/property-listing/review-listing");
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: `Failed to submit property: ${err.message}`,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Cancel Property Listing?",
      text: "All entered data will be lost. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "No, continue",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        reset();
        localStorage.removeItem("addPropertyStep");
        router.push("/pages/landlord/property-listing");
      }
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepOne />;
      case 2:
        return <StepTwo />;
      case 3:
        return <StepThree />;
      case 4:
        return <StepFour />;
      case 5:
        return <StepFive />;
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Proper spacing for navbar and sidebar */}
      <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
        {/* Header - Compact and clean */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Add New Property
          </h1>
          <p className="text-sm text-gray-600">
            Fill in the details below to list your property and start attracting
            tenants.
          </p>
        </div>

        {/* Step Counter */}
        <div className="mb-6">
          <StepCounter currentStep={step} />
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
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-lg font-medium transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
              </div>

              {/* Right Side: Continue / Submit */}
              <div>
                {step < 5 ? (
                  <button
                    onClick={nextStep}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit Listing</span>
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
