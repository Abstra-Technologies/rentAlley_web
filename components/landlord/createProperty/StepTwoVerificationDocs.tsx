"use client";

import { useState, useEffect } from "react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import DropzoneUploader from "./dropzone-uploader";
import CameraWeb from "@/components/lib/camera";
import Swal from "sweetalert2";

export default function StepTwoVerificationDocs() {
  const {
    docType,
    setDocType,
    submittedDoc,
    setSubmittedDoc,
    govID,
    setGovID,
    indoorPhoto,
    outdoorPhoto,
    setIndoorPhoto,
    setOutdoorPhoto,
  } = usePropertyStore();

  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState("");
  const [indoorPreview, setIndoorPreview] = useState(null);
  const [outdoorPreview, setOutdoorPreview] = useState(null);

  const MAX_SIZE = 20 * 1024 * 1024;

  useEffect(() => {
    if (indoorPhoto instanceof Blob)
      setIndoorPreview(URL.createObjectURL(indoorPhoto));
    if (outdoorPhoto instanceof Blob)
      setOutdoorPreview(URL.createObjectURL(outdoorPhoto));
  }, [indoorPhoto, outdoorPhoto]);

  const openCamera = (type: "indoor" | "outdoor") => {
    setPhotoType(type);
    setShowCamera(true);
  };

  /* ----------- Capture with react-webcam ----------- */
  const handleCapture = (imageData) => {
    fetch(imageData)
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

  /* ---------- PDF validation ---------- */
  const validatePDF = (file, setState) => {
    if (!file) return;

    if (file.size > MAX_SIZE) {
      Swal.fire("File too large", "Max 20MB allowed", "warning");
      return setState(null);
    }
    if (file.type !== "application/pdf") {
      Swal.fire("Invalid file", "Only PDF is allowed.", "error");
      return setState(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Verification Documents
        </h2>
        <p className="text-gray-600 mt-1">
          Upload documents required for property verification.
        </p>
      </div>

      {/* DOCUMENT TYPE + UPLOAD */}
      <section
        className="bg-white p-6 rounded-xl shadow-sm border space-y-6"
        id="doc-type-section"
      >
        {/* Select Type */}
        <div className="space-y-2">
          <label className="font-semibold">Select Document Type *</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border rounded-xl"
          >
            <option value="business_permit">Business/Mayor's Permit</option>
            <option value="occupancy_permit">Occupancy Permit</option>
            <option value="property_title">Property Title</option>
          </select>
        </div>

        {/* 2 Column upload */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          id="document-uploads"
        >
          <DropzoneUploader
            label="Upload Legal Document (PDF)"
            file={submittedDoc}
            setFile={(file) => {
              if (file?.file) validatePDF(file.file, setSubmittedDoc);
              setSubmittedDoc(file?.file);
            }}
            accept="application/pdf"
          />

          <DropzoneUploader
            label="Government ID (PDF or Image)"
            file={govID}
            setFile={(file) => setGovID(file?.file)}
            accept="application/pdf,image/*"
          />
        </div>
      </section>

      {/* PHOTO CAPTURE */}
      <section
        className="bg-white p-6 rounded-xl shadow-sm border space-y-6"
        id="photo-capture-section"
      >
        <h3 className="font-semibold text-lg">Verification Photos</h3>
        <p className="text-gray-600 text-sm">
          Capture clear indoor and outdoor photos for verification.
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            className="bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
            onClick={() => openCamera("indoor")}
          >
            📷 Capture Indoor Photo
          </button>

          <button
            className="bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition"
            onClick={() => openCamera("outdoor")}
          >
            📷 Capture Outdoor Photo
          </button>
        </div>

        {/* CAMERA MODAL */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-xl">
              <h4 className="text-lg font-semibold mb-4 capitalize">
                Capturing {photoType} photo
              </h4>

              <CameraWeb onCapture={handleCapture} />

              <button
                onClick={() => setShowCamera(false)}
                className="mt-4 w-full bg-gray-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PREVIEWS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Indoor */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Indoor Photo</h4>
            {indoorPreview ? (
              <img
                src={indoorPreview}
                className="rounded-xl h-48 w-full object-cover shadow"
              />
            ) : (
              <div className="h-48 w-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                No indoor photo
              </div>
            )}
          </div>

          {/* Outdoor */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Outdoor Photo</h4>
            {outdoorPreview ? (
              <img
                src={outdoorPreview}
                className="rounded-xl h-48 w-full object-cover shadow"
              />
            ) : (
              <div className="h-48 w-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                No outdoor photo
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
