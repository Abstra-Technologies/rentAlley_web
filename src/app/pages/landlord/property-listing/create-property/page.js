"use client";
import React, { useState } from "react";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord"; // Layout
import { useRouter } from "next/navigation";
import StepCounter from "../../../../../components/step-counter";
import { StepOne } from "../../../../../components/landlord/step1";
import { StepTwo } from "../../../../../components/landlord/step2";
import { StepThree } from "../../../../../components/landlord/step3";
import { StepFour } from "../../../../../components/landlord/step4";
import axios from "axios";
import usePropertyStore from "../../../../../zustand/propertyStore";
import useAuth from "../../../../../../hooks/useSession";
import useSWRMutation from "swr/mutation";
import Swal from "sweetalert2";

export default function AddNewProperty() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // Get user_id from useAuth hook
  const { user } = useAuth();

  // Access Zustand store
  const {
    property,
    photos,
    reset,
    mayorPermit,
    occPermit,
    indoorPhoto,
    outdoorPhoto,
    govID,
  } = usePropertyStore();

  const validateStep = () => {
    if (step === 1) {
      // Ensure property details are filled
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

      // Validate ZIP code (must be exactly 4 digits)
      const zipCodePattern = /^\d{4}$/; // Regex: Ensures exactly 4 digits
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
      // Ensure at least one photo is uploaded
      if (photos.length === 0) {
        Swal.fire(
          "No Photos",
          "Please upload at least one property photo.",
          "warning"
        );
        return false;
      }

      if (property.totalUnits < 0) {
        Swal.fire(
          "Invalid Input",
          "Number of units cannot be negative.",
          "error"
        );
        return false;
      }

      // Validate that all uploaded files are images
      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

      for (let photo of photos) {
        if (!allowedImageTypes.includes(photo.file?.type)) {
          Swal.fire(
            "Invalid File Type",
            "Only image files (e.g. JPEG, PNG, WEBP) are allowed for property photos.",
            "error"
          );
          return false;
        }
      }
    }

    if (step === 4) {
      // Ensure required documents are uploaded
      if (
        !occPermit?.file ||
        !mayorPermit?.file ||
        !indoorPhoto ||
        !outdoorPhoto ||
        !govID?.file
      ) {
        Swal.fire(
          "Missing Documents",
          "Please upload all required documents.",
          "warning"
        );
        return false;
      }
      // Validate PDF files (Mayor Permit & Occupancy Permit)
      const isPDF = (file) => file && file.type === "application/pdf";
      if (!isPDF(mayorPermit?.file)) {
        Swal.fire(
          "Invalid File",
          "Business/Mayor's Permit must be a PDF file.",
          "error"
        );
        return false;
      }
      if (!isPDF(occPermit?.file)) {
        Swal.fire(
          "Invalid File",
          "Occupancy Permit must be a PDF file.",
          "error"
        );
        return false;
      }
    }

    return true; // If all validations pass
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 4)); // Prevent going past step 4
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1)); // Prevent going below step 1
  };

  // Axios instance
  const axiosInstance = axios.create({});

  // SWR Mutation for property creation
  const sendPropertyData = async (url, { arg }) => {
    console.log("Property Data: ", arg);
    return axiosInstance
      .post(url, arg, { headers: { "Content-Type": "application/json" } })
      .then((res) => res.data);
  };
  const { trigger, isMutating } = useSWRMutation(
    `/api/propertyListing/propListing?landlord_id=${user?.landlord_id}`,
    sendPropertyData
  );

  // Upload photos function
  const uploadPhotos = async (propertyID) => {
    const formData = new FormData();

    formData.append("property_id", propertyID); // ✅ Fix: Add property_id to FormData

    console.log("Uploading files:", photos);
    photos.forEach((photo, index) => {
      if (photo.file instanceof File) {
        formData.append("files", photo.file);
        console.log(`Uploading File ${index + 1}:`, photo.file.name);
      } else {
        console.warn(`Skipping invalid file:`, photo);
      }
    }); // ✅ Ensure it's a File object;

    // Debugging FormData contents before sending
    for (let pair of formData.entries()) {
      console.log("FormData Key:", pair[0], "Value:", pair[1]);
    }

    try {
      const { data } = await axios.post(
        `/api/propertyListing/propPhotos`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }, // Ensures proper handling
        }
      );

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      console.log("Photo upload response:", data); // Log response from server
      return data;
    } catch (error) {
      console.error("Photo upload failed:", error);
      console.error("Response:", error.response?.data); // Log error response
      throw error;
    }
  };
  // Upload Property Requirements
  const uploadPropertyRequirements = async (propertyID) => {
    const formData = new FormData();
    formData.append("property_id", propertyID);

    formData.append("occPermit", occPermit?.file);
    formData.append("mayorPermit", mayorPermit?.file);
    formData.append("govID", govID?.file);
    formData.append("indoor", indoorPhoto);
    formData.append("outdoor", outdoorPhoto);

    console.log("occPermit Type:", occPermit); // Debug
    console.log("mayorPermit Type:", mayorPermit); // Debug
    console.log("Indoor Photo Type:", indoorPhoto); // Debug
    console.log("Outdoor Photo Type:", outdoorPhoto); // Debug
    console.log("Government ID:", govID); // Debug

    try {
      const { data } = await axios.post(
        "/api/propertyListing/propVerify",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Property files uploaded:", data);
      return data;
    } catch (error) {
      console.error("Property file upload failed:", error.response?.data);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) {
      return;
    }

    if (!user) {
      Swal.fire(
        "Authentication Error",
        "User not authenticated. Please log in.",
        "error"
      );
      return;
    }

    try {
      // Step 1: Submit property details first
      const propertyData = { ...property, landlord_id: user?.landlord_id };
      const createdProperty = await trigger(propertyData); // Send to propListing API
      const propertyID = createdProperty.propertyID;

      // Create promises for photo and verification file uploads (if any)
      const photoUploadPromise =
        photos.length > 0 ? uploadPhotos(propertyID) : Promise.resolve();
      const verificationUploadPromise =
        occPermit && mayorPermit && indoorPhoto && outdoorPhoto
          ? uploadPropertyRequirements(propertyID)
          : Promise.resolve();

      // Await all uploads in parallel
      await Promise.all([photoUploadPromise, verificationUploadPromise]);
      reset(); // Clear form
      router.push("/pages/landlord/property-listing/review-listing"); // Redirect after success
    } catch (error) {
      Swal.fire("Error", `Something went wrong: ${error.message}`, "error");
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
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <LandlordLayout>
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1 p-8">
            {/* Step Counter */}
            <StepCounter currentStep={step} />

            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              {renderStep()}

              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Back
                  </button>
                )}
                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isMutating}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                  >
                    {isMutating ? "Publishing..." : "Publish"}
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
