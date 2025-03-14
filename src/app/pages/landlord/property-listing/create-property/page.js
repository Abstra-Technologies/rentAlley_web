"use client";
import React, { useState } from "react";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";
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
  const { user } = useAuth();

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
      if (photos.length === 0) {
        Swal.fire(
          "No Photos",
          "Please upload at least three property photo.",
          "warning"
        );
        return false;
      }

      if (photos.length < 3) {
        Swal.fire(
          "Insufficient Photos",
          "Please upload at least three property photo.",
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

      if (!property.propDesc || property.propDesc.trim().length === 0) {
        Swal.fire(
          "Missing Description",
          "Please enter the description of the property",
          "error"
        );
        return false;
      }

      if (!property.floorArea || property.floorArea.trim().length === 0) {
        Swal.fire(
          "Missing floor area",
          "Please enter the floor area of the property",
          "error"
        );
        return false;
      }

      if (!property.propDesc || property.propDesc.trim().length === 0) {
        Swal.fire(
          "Missing Description",
          "Please enter a description.",
          "error"
        );
        return false;
      }

      if (!property.secDeposit || property.secDeposit <= 0) {
        Swal.fire(
          "Missing Security Deposit",
          "Please enter a valid security deposit amount.",
          "error"
        );
        return false;
      }

      if (!property.advancedPayment || property.advancedPayment <= 0) {
        Swal.fire(
          "Missing Advanced Payment",
          "Please enter a valid advanced payment amount.",
          "error"
        );
        return false;
      }

      if (!property.lateFee || property.lateFee < 0) {
        Swal.fire(
          "Missing Late Fee",
          "Please enter a valid late fee amount (0 or higher).",
          "error"
        );
        return false;
      }

      if (!property.assocDues || property.assocDues < 0) {
        Swal.fire(
          "Missing Association Dues",
          "Please enter a valid association dues amount (0 or higher).",
          "error"
        );
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

      if (
        !property.paymentFrequency ||
        property.paymentFrequency.trim() === ""
      ) {
        Swal.fire(
          "Missing Payment Frequency",
          "Please select a payment frequency.",
          "error"
        );
        return false;
      }

      if (
        !property.utilityBillingType ||
        property.utilityBillingType.trim() === ""
      ) {
        Swal.fire(
          "Missing Utility Billing Type",
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
            "Only image files (e.g. JPEG, PNG, WEBP) are allowed for property photos.",
            "error"
          );
          return false;
        }
      }
    }

    if (step === 4) {
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

    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const axiosInstance = axios.create({});

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

  const uploadPhotos = async (propertyID) => {
    const formData = new FormData();

    formData.append("property_id", propertyID);

    console.log("Uploading files:", photos);
    photos.forEach((photo, index) => {
      if (photo.file instanceof File) {
        formData.append("files", photo.file);
        console.log(`Uploading File ${index + 1}:`, photo.file.name);
      } else {
        console.warn(`Skipping invalid file:`, photo);
      }
    });

    // Debugging FormData contents before sending
    for (let pair of formData.entries()) {
      console.log("FormData Key:", pair[0], "Value:", pair[1]);
    }

    try {
      const { data } = await axios.post(
        `/api/propertyListing/propPhotos`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      console.log("Photo upload response:", data);
      return data;
    } catch (error) {
      console.error("Photo upload failed:", error);
      console.error("Response:", error.response?.data);
      throw error;
    }
  };

  const uploadPropertyRequirements = async (propertyID) => {
    const formData = new FormData();
    formData.append("property_id", propertyID);

    formData.append("occPermit", occPermit?.file);
    formData.append("mayorPermit", mayorPermit?.file);
    formData.append("govID", govID?.file);
    formData.append("indoor", indoorPhoto);
    formData.append("outdoor", outdoorPhoto);

    console.log("occPermit Type:", occPermit);
    console.log("mayorPermit Type:", mayorPermit);
    console.log("Indoor Photo Type:", indoorPhoto);
    console.log("Outdoor Photo Type:", outdoorPhoto);
    console.log("Government ID:", govID);

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

    Swal.fire({
      title: "Submitting...",
      text: "Please wait while we submit your property listing.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const propertyData = { ...property, landlord_id: user?.landlord_id };
      const createdProperty = await trigger(propertyData);
      const propertyID = createdProperty.propertyID;

      const photoUploadPromise =
        photos.length > 0 ? await uploadPhotos(propertyID) : Promise.resolve();
      const verificationUploadPromise =
        occPermit && mayorPermit && indoorPhoto && outdoorPhoto
          ? await uploadPropertyRequirements(propertyID)
          : Promise.resolve();

      await Promise.all([photoUploadPromise, verificationUploadPromise]);

      reset();

      Swal.fire({
        title: "Success!",
        text: "Your property listing has been successfully submitted.",
        icon: "success",
      }).then(() => {
        router.push("/pages/landlord/property-listing/review-listing");
      });

      // router.push("/pages/landlord/property-listing/review-listing");
    } catch (error) {
      console.error("Property listing failed:", error.response?.data);

      if (error.response?.data?.status === "rejected") {
        if (verificationAttempts < 2) {
          Swal.fire(
            "Verification Failed",
            "Your property verification was rejected. You have one more attempt.",
            "warning"
          );
          setVerificationAttempts((prev) => prev + 1);
          setStep(4);
        } else {
          Swal.fire(
            "Verification Failed",
            "Your property listing has been rejected twice. Please contact support.",
            "error"
          );
          router.push("/pages/landlord/property-listing");
        }
      } else {
        Swal.fire("Error", `Something went wrong: ${error.message}`, "error");
      }
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
                    disabled={isMutating}
                    className={`px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 
      ${isMutating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Back
                  </button>
                )}
                {step < 4 ? (
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
                    disabled={isMutating}
                    className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
                      disabled:opacity-50 ${
                        isMutating ? "cursor-not-allowed" : ""
                      }`}
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
