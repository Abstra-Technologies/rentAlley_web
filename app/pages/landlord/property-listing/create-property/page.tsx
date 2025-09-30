"use client";
import React, { useState, useEffect } from "react";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";
import { useRouter } from "next/navigation";
import StepCounter from "../../../../../components/step-counter";
import { StepOne } from "../../../../../components/landlord/step1";
import { StepTwo } from "../../../../../components/landlord/step2";
import { StepThree } from "../../../../../components/landlord/step3";
import { StepFive } from "../../../../../components/landlord/step5";
import { StepFour } from "../../../../../components/landlord/step4";

import axios from "axios";
import usePropertyStore from "../../../../../zustand/property/usePropertyStore";
import useAuthStore from "../../../../../zustand/authStore";
import useSWRMutation from "swr/mutation";
import Swal from "sweetalert2";

export default function AddNewProperty() {
  const router = useRouter();
  const [step, setStep] = useState(() => {
    const savedStep =
      typeof window !== "undefined"
        ? localStorage.getItem("addPropertyStep")
        : null;
    return savedStep ? Number(savedStep) : 1;
  });
  const { fetchSession, user, admin } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("addPropertyStep", String(step));
    }
  }, [step]);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

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
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
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
      if (!property.paymentFrequency) {
        Swal.fire({
          title: "Missing Payment Frequency",
          text: "Please select a payment frequency.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (property.lateFee == null || property.lateFee < 0) {
        Swal.fire({
          title: "Missing Late Fee",
          text: "Enter a valid late fee (0 or higher).",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
      if (property.assocDues == null || property.assocDues < 0) {
        Swal.fire({
          title: "Missing Association Dues",
          text: "Enter a valid amount (0 or higher).",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
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
    <LandlordLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Page Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Add New Property
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Fill in the details below to list your property and start
              attracting tenants.
            </p>
          </div>

          {/* Step Counter */}
          <StepCounter currentStep={step} />

          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Step Content */}
            <div className="min-h-[600px]">{renderStep()}</div>

            {/* Navigation Controls */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky bottom-4 z-10">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Left Side - Back Button */}
                  <div className="flex">
                    {step > 1 && (
                      <button
                        onClick={prevStep}
                        disabled={submitting}
                        className="flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed text-sm sm:text-base"
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
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        <span>Back</span>
                      </button>
                    )}
                  </div>

                  {/* Center - Cancel Button */}
                  <button
                    onClick={handleCancel}
                    disabled={submitting}
                    className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed text-sm sm:text-base"
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
                    <span>Cancel</span>
                  </button>

                  {/* Right Side - Next/Submit Button */}
                  <div className="flex">
                    {step < 5 ? (
                      <button
                        onClick={nextStep}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none text-sm sm:text-base"
                        disabled={submitting}
                      >
                        <span>Continue</span>
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none text-sm sm:text-base"
                      >
                        {submitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
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
      </div>
    </LandlordLayout>
  );
}
