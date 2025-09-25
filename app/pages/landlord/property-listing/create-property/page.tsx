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
        typeof window !== "undefined" ? localStorage.getItem("addPropertyStep") : null;
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
        Swal.fire("Missing Details", "Please fill in all property details.", "warning");
        return false;
      }
      if (!/^\d{4}$/.test(String(property.zipCode))) {
        Swal.fire("Invalid ZIP Code", "Zip Code must be exactly 4 digits.", "error");
        return false;
      }
    }

    if (step === 3) {
      if (photos.length < 3) {
        Swal.fire("Insufficient Photos", "Upload at least three property photos.", "warning");
        return false;
      }
      if (property.totalUnits != null && property.totalUnits < 0) {
        Swal.fire("Invalid Input", "Number of units cannot be negative.", "error");
        return false;
      }
      if (!property.propDesc?.trim()) {
        Swal.fire("Missing Description", "Please enter a description.", "warning");
        return false;
      }
      if (!property.floorArea || property.floorArea <= 0) {
        Swal.fire("Missing Floor Area", "Please enter a valid floor area.", "error");
        return false;
      }
      if (!property.minStay || property.minStay <= 0) {
        Swal.fire("Missing Minimum Stay", "Enter minimum stay duration (in months).", "error");
        return false;
      }
      if (!property.waterBillingType?.trim()) {
        Swal.fire("Missing Water Billing Type", "Please select a billing type.", "error");
        return false;
      }
      if (!property.electricityBillingType?.trim()) {
        Swal.fire("Missing Electricity Billing Type", "Please select a billing type.", "error");
        return false;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      for (let photo of photos) {
        if (!allowedTypes.includes(photo.file?.type)) {
          Swal.fire("Invalid File", "Only JPEG, PNG, or WEBP images are allowed.", "error");
          return false;
        }
      }
    }

    if (step === 4) {
      if (!property.paymentFrequency) {
        Swal.fire("Missing Payment Frequency", "Please select one.", "error");
        return false;
      }
      if (property.lateFee == null || property.lateFee < 0) {
        Swal.fire("Missing Late Fee", "Enter a valid late fee (0 or higher).", "error");
        return false;
      }
      if (property.assocDues == null || property.assocDues < 0) {
        Swal.fire("Missing Association Dues", "Enter a valid amount (0 or higher).", "error");
        return false;
      }
      if (property.rentIncreasePercent == null || property.rentIncreasePercent < 0) {
        Swal.fire("Missing Rent Increase", "Enter a valid percentage (0 or higher).", "error");
        return false;
      }
      if (property.securityDepositMonths == null || property.securityDepositMonths < 0) {
        Swal.fire("Missing Security Deposit", "Enter number of months required.", "error");
        return false;
      }
      if (property.advancePaymentMonths == null || property.advancePaymentMonths < 0) {
        Swal.fire("Missing Advance Payment", "Enter number of months required.", "error");
        return false;
      }
    }

    if (step === 5) {
      if (!submittedDoc?.file || !govID?.file || !indoorPhoto || !outdoorPhoto) {
        Swal.fire("Missing Documents", "Upload all required documents.", "warning");
        return false;
      }
      if (submittedDoc?.file.type !== "application/pdf") {
        Swal.fire("Invalid File", `${docType.replace("_", " ")} must be a PDF.`, "error");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => validateStep() && setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("landlord_id", String(user?.landlord_id));
      formData.append("property", JSON.stringify(property));

      photos.forEach((p) => p.file && formData.append("photos", p.file));
      formData.append("docType", docType);
      // @ts-ignore
      formData.append("submittedDoc", submittedDoc.file);
      // @ts-ignore
      formData.append("govID", govID.file);
      formData.append("indoor", indoorPhoto);
      formData.append("outdoor", outdoorPhoto);

      await axios.post("/api/propertyListing/createFullProperty", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      reset();
      Swal.fire("Success!", "Property listing submitted.", "success").then(() => {
        localStorage.removeItem("addPropertyStep");
        router.push("/pages/landlord/property-listing/review-listing");
      });
    } catch (err: any) {
      Swal.fire("Error", `Failed to submit property: ${err.message}`, "error");
    } finally {
      setSubmitting(false);
    }
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
      <div className="min-h-screen bg-gray-100">
        <LandlordLayout>
          <div className="flex">
            <main className="flex-1 p-8">
              <StepCounter currentStep={step} />

              <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                {renderStep()}

                <div className="flex justify-between mt-6">
                  {step > 1 && (
                      <button
                          onClick={prevStep}
                          disabled={submitting}
                          className={`px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 ${
                              submitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                      >
                        Back
                      </button>
                  )}

                  <div className="flex space-x-2">
                    <button
                        onClick={() => {
                          Swal.fire({
                            title: "Cancel Property Listing?",
                            text: "All entered data will be lost.",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Yes, cancel",
                            cancelButtonText: "No, stay",
                          }).then((res) => {
                            if (res.isConfirmed) {
                              reset();
                              localStorage.removeItem("addPropertyStep");
                              router.push("/pages/landlord/property-listing");
                            }
                          });
                        }}
                        disabled={submitting}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </div>

                  {step < 5 ? (
                      <button
                          onClick={nextStep}
                          className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                              submitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={submitting}
                      >
                        Next
                      </button>
                  ) : (
                      <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 ${
                              submitting ? "cursor-not-allowed" : ""
                          }`}
                      >
                        {submitting ? "Submitting..." : "Submit"}
                      </button>
                  )}
                </div>
              </div>
            </main>
          </div>
        </LandlordLayout>
      </div>
  );
}
