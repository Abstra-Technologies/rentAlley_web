import React, { useEffect, useState } from "react";
import usePropertyStore from "../../zustand/propertyStore";
import DropzoneUploader from "../dropzone-uploader";
import Camera from "../lib/camera";
import Swal from "sweetalert2";

export function StepFour() {
  // Access the property data and actions from Zustand store
  const {
    setMayorPermit,
    setOccPermit,
    setIndoorPhoto,
    setOutdoorPhoto,
    setGovID,
    indoorPhoto,
    outdoorPhoto,
    occPermit,
    mayorPermit,
    govID,
  } = usePropertyStore();
  // State to control the camera
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState(""); // "indoor" or "outdoor"

  // Local states for file previews
  const [indoorPreview, setIndoorPreview] = useState(null);
  const [outdoorPreview, setOutdoorPreview] = useState(null);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (indoorPhoto) {
      // Create a local URL for the indoor photo if it exists in Zustand
      setIndoorPreview(URL.createObjectURL(indoorPhoto));
    }
  }, [indoorPhoto]); // Run when indoorPhoto changes

  useEffect(() => {
    if (outdoorPhoto) {
      // Create a local URL for the outdoor photo if it exists in Zustand
      setOutdoorPreview(URL.createObjectURL(outdoorPhoto));
    }
  }, [outdoorPhoto]); // Run when outdoorPhoto changes

  // Open camera for a specific type of photo
  const handleOpenCamera = (type) => {
    setPhotoType(type);
    setShowCamera(true);
  };

  // Handle image capture
  const handleCapture = (image) => {
    if (photoType === "indoor") {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "indoor.jpg", { type: "image/jpeg" });
          setIndoorPhoto(file);
        });
    } else {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "outdoor.jpg", { type: "image/jpeg" });
          setOutdoorPhoto(file);
        });
    }
    setShowCamera(false);
  };

  const validateFile = (file, setFile) => {
    if (!file) return true;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      Swal.fire(
        "File Size Too Large",
        `File size exceeds ${MAX_FILE_SIZE_MB}MB. Please upload a smaller file.`,
        "warning"
      );
      setFile(null); // Clear the file
      return false;
    }

    // Ensure only PDF files are allowed
    if (file.type !== "application/pdf") {
      Swal.fire(
        "Invalid File Type",
        "Only PDF file types are allowed.",
        "error"
      );
      setFile(null);
      return false;
    }

    return true;
  };

  const handleMayorPermitChange = (file) => {
    if (validateFile(file?.file, setMayorPermit)) {
      setMayorPermit(file);
    }
  };

  const handleOccPermitChange = (file) => {
    if (validateFile(file?.file, setOccPermit)) {
      setOccPermit(file);
    }
  };

  const handleGovIDChange = (file) => {
    if (validateFile(file?.file, setGovID)) {
      setGovID(file);
    }
  };

  return (
    <div>
      {/* Requirements Section */}
      <h2 className="text-2xl font-bold mb-4">Add Requirements</h2>
      <ol className="text-gray-500 mb-6 list-decimal list-inside">
        <li>Please upload an occupancy permit in PDF format.</li>
        <li>
          Please upload a business or mayor&#39;s permit of the property in PDF
          format.
        </li>
        <li>Please upload a valid government ID in PDF format.</li>
      </ol>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mayor's Permit Upload */}
        <DropzoneUploader
          label="Business or Mayor's Permit (PDF)"
          file={mayorPermit}
          setFile={handleMayorPermitChange}
          accept="application/pdf"
          multiple={false}
        />

        {/* Occupancy Permit Upload */}
        <DropzoneUploader
          label="Occupancy Permit (PDF)"
          file={occPermit}
          setFile={handleOccPermitChange}
          accept="application/pdf"
          multiple={false}
        />

        {/* Government ID Upload */}
        <DropzoneUploader
          label="Government ID"
          file={govID}
          setFile={handleGovIDChange}
          accept="application/pdf"
          multiple={false}
        />
      </div>

      <hr className="my-8" />

      {/* Property Verification Section */}
      <h2 className="text-2xl font-bold mb-4">Property Verification</h2>
      <p className="text-gray-500 mb-4">
        Please take two photos of the property (inside and outside). This will
        be used for verification purposes only.
      </p>
      <p className="text-gray-500 mb-4">
        Please make sure that the photos are the same as the ones uploaded in
        Step 3.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => handleOpenCamera("indoor")}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Capture Indoor
        </button>
        <button
          onClick={() => handleOpenCamera("outdoor")}
          className="bg-green-500 text-white px-4 py-2 rounded-md"
        >
          Capture Outdoor
        </button>
      </div>
      {showCamera && <Camera onCapture={handleCapture} />}

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Indoor Photos</h3>
        {indoorPreview && (
          <img
            src={indoorPreview}
            alt="Indoor Preview"
            className="w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Outdoor Photos</h3>
        {outdoorPreview && (
          <img
            src={outdoorPreview}
            alt="Outdoor Preview"
            className="w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>
    </div>
  );
}
