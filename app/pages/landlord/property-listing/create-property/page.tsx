"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Loader2,
  HelpCircle,
  Building2,
  FileCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  createPropertySteps,
  verificationDocsSteps,
} from "@/lib/onboarding/createProperty";

import StepTwoVerificationDocs from "@/components/landlord/createProperty/StepTwoVerificationDocs";
import StepCounter from "@/components/step-counter";
import StepOneCreateProperty from "@/components/landlord/createProperty/StepOnePropertyDetails";

export default function AddNewProperty() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const { fetchSession, user } = useAuthStore();
  const { subscription, loadingSubscription } = useSubscription(
    user?.landlord_id,
  );

  const {
    property,
    photos,
    submittedDoc,
    govID,
    indoorPhoto,
    outdoorPhoto,
    docType,
    reset,
  } = usePropertyStore();

  /* ================= ONBOARDING ================= */
  const step1Onboarding = useOnboarding({
    tourId: "create-property-step1",
    steps: createPropertySteps,
    autoStart: true,
  });

  const step2Onboarding = useOnboarding({
    tourId: "create-property-step2",
    steps: verificationDocsSteps,
    autoStart: true,
  });

  /* ================= SESSION ================= */
  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

  /* ================= SUBSCRIPTION CHECK ================= */
  useEffect(() => {
    if (loadingSubscription || !user?.landlord_id || !subscription) return;

    if (subscription.is_active !== 1) {
      Swal.fire({
        title: "Subscription Required",
        text: "You need an active subscription to add a property.",
        icon: "info",
        showConfirmButton: false,
        html: `
          <button id="goBack"
            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
            Go Back
          </button>
        `,
        didOpen: () => {
          const btn = document.getElementById("goBack");
          if (btn) {
            btn.onclick = () => {
              router.replace("/pages/landlord/property-listing");
            };
          }
        },
      });
    }
  }, [subscription, loadingSubscription, user, router]);

  /* ================= VALIDATION ================= */
  const validateStep = () => {
    if (step === 1) {
      if (
        !property.propertyName ||
        !property.propertyType ||
        !property.street ||
        !property.city ||
        !property.province ||
        !property.zipCode ||
        !property.floorArea ||
        !property.propDesc ||
        !property.waterBillingType ||
        !property.electricityBillingType
      ) {
        Swal.fire(
          "Missing Fields",
          "Please fill all required details.",
          "warning",
        );
        return false;
      }

      if (photos.length < 3) {
        Swal.fire(
          "Insufficient Photos",
          "Upload at least 3 property photos.",
          "warning",
        );
        return false;
      }
    }

    if (step === 2) {
      if (!submittedDoc || !govID || !indoorPhoto || !outdoorPhoto) {
        Swal.fire(
          "Missing Documents",
          "Complete all verification documents.",
          "warning",
        );
        return false;
      }

      if (submittedDoc.type !== "application/pdf") {
        Swal.fire("Invalid File", "Submitted document must be PDF.", "error");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => validateStep() && setStep(2);
  const prevStep = () => setStep(1);

  /* ================= CANCEL ================= */
  const handleCancel = () => {
    Swal.fire({
      title: "Cancel Property Setup?",
      text: "All progress will be lost. Do you want to continue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        reset();
        router.replace("/pages/landlord/property-listing");
      }
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);

    const formData = new FormData();
    formData.append("landlord_id", String(user.landlord_id));
    formData.append("property", JSON.stringify(property));

    photos.forEach((p) => formData.append("photos", p.file));
    formData.append("docType", docType);
    formData.append("submittedDoc", submittedDoc);
    formData.append("govID", govID);
    formData.append("indoor", indoorPhoto);
    formData.append("outdoor", outdoorPhoto);

    try {
      await axios.post("/api/propertyListing/createFullProperty", formData);

      Swal.fire("Success!", "Property submitted successfully!", "success").then(
        () => {
          reset();
          router.replace("/pages/landlord/property-listing/review-listing");
        },
      );
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to submit property.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 pb-28 sm:pb-8">
      <div className="px-3 sm:px-4 md:px-8 lg:px-12 xl:px-16 pt-20 sm:pt-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              {step === 1 ? (
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Add New Property
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {step === 1
                  ? "Fill in the details to create your listing"
                  : "Upload verification documents"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              step === 1
                ? step1Onboarding.startTour()
                : step2Onboarding.startTour()
            }
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors self-start"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Show Guide</span>
            <span className="sm:hidden">Help</span>
          </button>
        </div>

        {/* STEP COUNTER */}
        <StepCounter currentStep={step} totalSteps={2} />

        {/* CONTENT */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-gray-200/50 border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6">
            {step === 1 && <StepOneCreateProperty />}
            {step === 2 && <StepTwoVerificationDocs />}
          </div>
        </div>

        {/* FOOTER - Fixed on mobile */}
        <div className="fixed bottom-0 left-0 right-0 sm:static bg-white sm:rounded-xl sm:rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] sm:shadow-lg border-t sm:border border-gray-200 sm:border-gray-100 p-3 sm:p-4 md:p-5 z-50">
          <div className="flex justify-between items-center gap-3 max-w-7xl mx-auto">
            {/* Left Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleCancel}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>

              <button
                type="button"
                disabled={submitting || step === 1}
                onClick={prevStep}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>

            {/* Right Button */}
            <div>
              {step === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={submitting}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg sm:rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
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
  );
}
