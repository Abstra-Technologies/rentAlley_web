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
        Swal.fire("Missing Details", "Please fill in all property details before proceeding.", "warning");
        return false;
      }

      const zipCodePattern = /^\d{4}$/;
      if (!zipCodePattern.test(property.zipCode)) {
        Swal.fire("Invalid ZIP Code", "Zip Code must be exactly 4 digits.", "error");
        return false;
      }
    }

    if (step === 3) {
      if (photos.length === 0 || photos.length < 3) {
        Swal.fire("Insufficient Photos", "Please upload at least three property photos.", "warning");
        return false;
      }

      if (property.totalUnits < 0) {
        Swal.fire("Invalid Input", "Number of units cannot be negative.", "error");
        return false;
      }

      if (!property.propDesc?.trim()) {
        Swal.fire("Missing Description", "Please enter a description of the property.", "error");
        return false;
      }

      if (!property.floorArea || property.floorArea <= 0) {
        Swal.fire("Missing Floor Area", "Please enter the floor area of the property.", "error");
        return false;
      }

      if (!property.minStay || property.minStay <= 0) {
        Swal.fire("Missing Minimum Stay", "Please enter the minimum stay duration (in months).", "error");
        return false;
      }

      if (!property.waterBillingType?.trim()) {
        Swal.fire("Missing Water Utility Billing Type", "Please select a utility billing type.", "error");
        return false;
      }

      if (!property.electricityBillingType?.trim()) {
        Swal.fire("Missing Electricity Utility Billing Type", "Please select a utility billing type.", "error");
        return false;
      }

      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
      for (let photo of photos) {
        if (!allowedImageTypes.includes(photo.file?.type)) {
          Swal.fire("Invalid File Type", "Only JPEG, PNG, or WEBP images are allowed.", "error");
          return false;
        }
      }
    }

    if (step === 4) {
      if (!property.paymentFrequency) {
        Swal.fire("Missing Payment Frequency", "Please select a payment frequency.", "error");
        return false;
      }

      if (property.lateFee == null || property.lateFee < 0) {
        Swal.fire("Missing Late Fee", "Please enter a valid late fee amount (0 or higher).", "error");
        return false;
      }

      if (property.assocDues == null || property.assocDues < 0) {
        Swal.fire("Missing Association Dues", "Please enter a valid association dues amount (0 or higher).", "error");
        return false;
      }
    }

    if (step === 5) {
      if (!submittedDoc?.file || !govID?.file || !indoorPhoto || !outdoorPhoto) {
        Swal.fire("Missing Documents", "Please upload all required documents.", "warning");
        return false;
      }

      const isPDF = (file: File) => file && file.type === "application/pdf";
      if (!isPDF(submittedDoc?.file)) {
        Swal.fire("Invalid File", `${docType.replace("_", " ")} must be a PDF file.`, "error");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const axiosInstance = axios.create({});

  const sendPropertyData = async (url, { arg }) => {
    return axiosInstance
        .post(url, arg, { headers: { "Content-Type": "application/json" } })
        .then((res) => res.data);
  };

  const { trigger, isMutating } = useSWRMutation(
      `/api/propertyListing/createNewProperty?landlord_id=${user?.landlord_id}`,
      sendPropertyData
  );


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true); // 🔵 show "Submitting..."
    try {
      const formData = new FormData();
      formData.append("landlord_id", user?.landlord_id);
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
      setSubmitting(false); // 🔴 always reset
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
                          disabled={isMutating}
                          className={`px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 
                      ${isMutating ? "opacity-50 cursor-not-allowed" : ""}`}
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
                          }).then((result) => {
                            if (result.isConfirmed) {
                              reset();
                              localStorage.removeItem("addPropertyStep");
                              router.push("/pages/landlord/property-listing");
                            }
                          });
                        }}
                        disabled={isMutating}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </div>

                  {step < 5 ? (
                      <button
                          onClick={nextStep}
                          className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                      ${isMutating ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={isMutating}
                      >
                        Next
                      </button>
                  ) : (
                      <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
  disabled:opacity-50 ${submitting ? "cursor-not-allowed" : ""}`}
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
