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
  const [indoorPreview, setIndoorPreview] = useState<string | null>(null);
  const [outdoorPreview, setOutdoorPreview] = useState<string | null>(null);
  const [docType, setDocType] = useState("business_permit"); // default choice

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    // @ts-ignore
    if (indoorPhoto instanceof File || indoorPhoto instanceof Blob) {
      setIndoorPreview(URL.createObjectURL(indoorPhoto));
    } else {
      setIndoorPreview(null);
    }
  }, [indoorPhoto]);

  useEffect(() => {
    // @ts-ignore
    if (outdoorPhoto instanceof File || outdoorPhoto instanceof Blob) {
      setOutdoorPreview(URL.createObjectURL(outdoorPhoto));
    } else {
      setOutdoorPreview(null);
    }
  }, [outdoorPhoto]);


  const handleOpenCamera = (type: string) => {
    setPhotoType(type);
    setShowCamera(true);
  };

  const handleCapture = (image: string) => {
    fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${photoType}.jpg`, { type: "image/jpeg" });
          if (photoType === "indoor") setIndoorPhoto(file);
          else setOutdoorPhoto(file);
        });
    setShowCamera(false);
  };

  const validateFile = (file: File, setFile: (f: any) => void, allowAnyType = false) => {
    if (!file) return true;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      Swal.fire("File Size Too Large", `File exceeds ${MAX_FILE_SIZE_MB}MB.`, "warning");
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

  const handleDocChange = (file: any) => {
    if (validateFile(file?.file, setSubmittedDoc)) {
      setSubmittedDoc(file);
    }
  };

  const handleGovIDChange = (file: any) => {
    if (validateFile(file?.file, setGovID, true)) {
      setGovID(file);
    }
  };

  const docLabels: Record<string, string> = {
    business_permit: "Business / Mayor's Permit",
    occupancy_permit: "Occupancy Permit",
    property_title: "Property Title",
  };

  const docAcceptability: Record<string, string> = {
    business_permit: "High acceptability – usually ensures quick approval.",
    occupancy_permit: "Medium acceptability – may require further validation.",
    property_title: "High acceptability – strong proof of ownership.",
  };

  return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Documentary Requirements</h2>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Select Document Type
          </label>
          <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
          >
            <option value="business_permit">Business / Mayor's Permit</option>
            <option value="occupancy_permit">Occupancy Permit</option>
            <option value="property_title">Property Title</option>
          </select>

          <p className="mt-2 text-sm text-gray-500 italic">
            {docAcceptability[docType]}
          </p>
        </div>

        <DropzoneUploader
            label={`${docLabels[docType]} (PDF)`}
            file={submittedDoc}
            setFile={handleDocChange}
            accept="application/pdf"
            multiple={false}
        />

        <DropzoneUploader
            label="Government ID"
            file={govID}
            setFile={handleGovIDChange}
            accept="application/pdf"
            multiple={false}
        />

        <hr className="my-8" />

        <h2 className="text-2xl font-bold mb-4">Property Verification</h2>
        <p className="text-gray-500 mb-4">
          Please capture two photos of the property (inside and outside) for
          verification.
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
          <h3 className="text-lg font-semibold">Indoor Photo</h3>
          {indoorPreview && (
              <img
                  src={indoorPreview}
                  alt="Indoor Preview"
                  className="w-24 h-24 object-cover rounded-md"
              />
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold">Outdoor Photo</h3>
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
