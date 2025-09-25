import React, { useEffect, useState } from "react";
import usePropertyStore from "../../zustand/property/usePropertyStore";
import DropzoneUploader from "../dropzone-uploader";
import Camera from "../lib/camera";
import Swal from "sweetalert2";

export function StepFive() {
  const {
    setGovID,
    setSubmittedDoc,
    setIndoorPhoto,
    setOutdoorPhoto,
    indoorPhoto,
    outdoorPhoto,
    govID,
    submittedDoc,
  } = usePropertyStore();

  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState("");
  const [indoorPreview, setIndoorPreview] = useState(null);
  const [outdoorPreview, setOutdoorPreview] = useState(null);
  const [docType, setDocType] = useState("business_permit"); // default choice

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (indoorPhoto instanceof File || indoorPhoto instanceof Blob) {
      setIndoorPreview(URL.createObjectURL(indoorPhoto));
    } else {
      setIndoorPreview(null);
    }
  }, [indoorPhoto]);

  useEffect(() => {
    if (outdoorPhoto instanceof File || outdoorPhoto instanceof Blob) {
      setOutdoorPreview(URL.createObjectURL(outdoorPhoto));
    } else {
      setOutdoorPreview(null);
    }
  }, [outdoorPhoto]);

  const handleOpenCamera = (type) => {
    setPhotoType(type);
    setShowCamera(true);
  };

  const handleCapture = (image) => {
    fetch(image)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `${photoType}.jpg`, {
          type: "image/jpeg",
        });
        if (photoType === "indoor") setIndoorPhoto(file);
        else setOutdoorPhoto(file);
      });
    setShowCamera(false);
  };

  const validateFile = (file, setFile, allowAnyType = false) => {
    if (!file) return true;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      Swal.fire(
        "File Size Too Large",
        `File exceeds ${MAX_FILE_SIZE_MB}MB.`,
        "warning"
      );
      setFile(null);
      return false;
    }

    if (!allowAnyType && file.type !== "application/pdf") {
      Swal.fire("Invalid File Type", "Only PDF files are allowed.", "error");
      setFile(null);
      return false;
    }

    return true;
  };

  const handleDocChange = (file) => {
    if (validateFile(file?.file, setSubmittedDoc)) {
      setSubmittedDoc(file);
    }
  };

  const handleGovIDChange = (file) => {
    if (validateFile(file?.file, setGovID, true)) {
      setGovID(file);
    }
  };

  const docLabels = {
    business_permit: "Business / Mayor's Permit",
    occupancy_permit: "Occupancy Permit",
    property_title: "Property Title",
  };

  const docAcceptability = {
    business_permit: "High acceptability – usually ensures quick approval.",
    occupancy_permit: "Medium acceptability – may require further validation.",
    property_title: "High acceptability – strong proof of ownership.",
  };

  const getAcceptabilityColor = (type) => {
    switch (type) {
      case "business_permit":
      case "property_title":
        return "text-green-600 bg-green-50 border-green-200";
      case "occupancy_permit":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Documentary Requirements
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
          Upload the required documents and photos to verify your property
          listing.
        </p>
      </div>

      {/* Document Upload Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Document Selection */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  1
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Legal Documents
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Select Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                >
                  <option value="business_permit">
                    Business / Mayor's Permit
                  </option>
                  <option value="occupancy_permit">Occupancy Permit</option>
                  <option value="property_title">Property Title</option>
                </select>
              </div>

              <div
                className={`p-3 sm:p-4 border rounded-lg text-sm ${getAcceptabilityColor(
                  docType
                )}`}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">Acceptability:</span>
                </div>
                <p className="mt-1 ml-6">{docAcceptability[docType]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <DropzoneUploader
                  label={`${docLabels[docType]} (PDF)`}
                  file={submittedDoc}
                  setFile={handleDocChange}
                  accept="application/pdf"
                  multiple={false}
                />
              </div>

              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <DropzoneUploader
                  label="Government ID (PDF or Image)"
                  file={govID}
                  setFile={handleGovIDChange}
                  accept="application/pdf,image/*"
                  multiple={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Verification Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  2
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Property Verification Photos
              </h3>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Please capture two photos of the property (inside and
                    outside) for verification purposes. These help us confirm
                    the property exists and matches your listing.
                  </p>
                </div>
              </div>
            </div>

            {/* Camera Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => handleOpenCamera("indoor")}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Capture Indoor Photo</span>
              </button>

              <button
                onClick={() => handleOpenCamera("outdoor")}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Capture Outdoor Photo</span>
              </button>
            </div>

            {/* Camera Component */}
            {showCamera && (
              <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-lg w-full">
                  <div className="mb-4 text-center">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Capturing {photoType === "indoor" ? "Indoor" : "Outdoor"}{" "}
                      Photo
                    </h4>
                  </div>
                  <Camera onCapture={handleCapture} />
                  <button
                    onClick={() => setShowCamera(false)}
                    className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Photo Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Indoor Photo Preview */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-6 4h4"
                    />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-700">
                    Indoor Photo
                  </h4>
                  {indoorPreview && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Captured
                    </span>
                  )}
                </div>

                {indoorPreview ? (
                  <div className="relative group">
                    <img
                      src={indoorPreview}
                      alt="Indoor Preview"
                      className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setIndoorPhoto(null);
                        setIndoorPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 sm:h-40 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-8 h-8 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-500">No photo captured</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Outdoor Photo Preview */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-700">
                    Outdoor Photo
                  </h4>
                  {outdoorPreview && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Captured
                    </span>
                  )}
                </div>

                {outdoorPreview ? (
                  <div className="relative group">
                    <img
                      src={outdoorPreview}
                      alt="Outdoor Preview"
                      className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setOutdoorPhoto(null);
                        setOutdoorPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 sm:h-40 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-8 h-8 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-500">No photo captured</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Verification Progress
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        submittedDoc ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    <span>Legal Document</span>
                  </span>
                  <span
                    className={`font-medium ${
                      submittedDoc ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {submittedDoc ? "Uploaded" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        govID ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    <span>Government ID</span>
                  </span>
                  <span
                    className={`font-medium ${
                      govID ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {govID ? "Uploaded" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        indoorPhoto && outdoorPhoto
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span>Verification Photos</span>
                  </span>
                  <span
                    className={`font-medium ${
                      indoorPhoto && outdoorPhoto
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {indoorPhoto && outdoorPhoto
                      ? "Complete"
                      : `${(indoorPhoto ? 1 : 0) + (outdoorPhoto ? 1 : 0)}/2`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
