"use client";
import React, { useState } from "react";
import LandlordLayout from "../../layouts/landlordLayouts";
import { useRouter } from "next/navigation";
import StepCounter from "../../../../../components/step-counter";
import {
  StepOne,
  StepTwo,
  StepThree,
  StepFour,
} from "../../../../../components/step-counter";
import axios from "axios";
import usePropertyStore from "../../../../../pages/zustand/propertyStore";
import useAuth from "../../../../../../hooks/useSession";
import useSWRMutation from "swr/mutation";

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
  } = usePropertyStore();

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4)); // Prevent going past step 4
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
    "/api/propertyListing/propListing",
    sendPropertyData
  );

  // Upload photos function
  const uploadPhotos = async (propertyID) => {
    if (!photos.length) return [];

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
        "/api/propertyListing/propPhotos",
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
    if (!occPermit || !mayorPermit || !indoorPhoto || !outdoorPhoto) {
      console.warn("Missing property files for verification.");
      return;
    }

    const formData = new FormData();
    formData.append("property_id", propertyID);

    formData.append("occPermit", occPermit?.file);
    formData.append("mayorPermit", mayorPermit?.file);
    formData.append("indoor", indoorPhoto);
    formData.append("outdoor", outdoorPhoto);

    console.log("occPermit Type:", occPermit); // Debug
    console.log("mayorPermit Type:", mayorPermit); // Debug
    console.log("Indoor Photo Type:", indoorPhoto); // Debug
    console.log("Outdoor Photo Type:", outdoorPhoto); // Debug

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
    if (!user) {
      alert("User not authenticated. Please log in.");
      return;
    }

    try {
      // Step 1: Submit property details first
      const propertyData = { ...property, user_id: user.user_id };
      const createdProperty = await trigger(propertyData); // Send to propListing API
      const propertyID = createdProperty.propertyID;

      console.log("Created Property ID:", propertyID);

      // Create promises for photo and verification file uploads (if any)
      const photoUploadPromise =
        photos.length > 0 ? uploadPhotos(propertyID) : Promise.resolve();
      const verificationUploadPromise =
        occPermit && mayorPermit && indoorPhoto && outdoorPhoto
          ? uploadPropertyRequirements(propertyID)
          : Promise.resolve();

      // Await all uploads in parallel
      await Promise.all([photoUploadPromise, verificationUploadPromise]);

      alert("Property created successfully!");
      reset(); // Clear form
      router.push("/pages/landlord/property-listing"); // Redirect after success
    } catch (error) {
      console.error("Error during property creation:", error);
      alert("Error: " + error.message);
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
                    {isMutating ? "Submitting..." : "Submit"}
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
