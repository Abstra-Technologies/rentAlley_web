"use client";

import { useState, useEffect } from "react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import DropzoneUploader from "./dropzone-uploader";
import CameraWeb from "@/components/lib/camera";
import Swal from "sweetalert2";
import {
  FileCheck,
  Upload,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  CreditCard,
  Image,
} from "lucide-react";

// Section Header Component
function SectionHeader({
  number,
  icon: Icon,
  title,
  subtitle,
}: {
  number: number;
  icon: any;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-4">
      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/25 flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

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
  const [photoType, setPhotoType] = useState<"indoor" | "outdoor">("indoor");
  const [indoorPreview, setIndoorPreview] = useState<string | null>(null);
  const [outdoorPreview, setOutdoorPreview] = useState<string | null>(null);

  const MAX_SIZE = 20 * 1024 * 1024;

  useEffect(() => {
    if (indoorPhoto instanceof Blob) {
      setIndoorPreview(URL.createObjectURL(indoorPhoto));
    }
    if (outdoorPhoto instanceof Blob) {
      setOutdoorPreview(URL.createObjectURL(outdoorPhoto));
    }
  }, [indoorPhoto, outdoorPhoto]);

  const openCamera = (type: "indoor" | "outdoor") => {
    setPhotoType(type);
    setShowCamera(true);
  };

  const handleCapture = (imageData: string) => {
    fetch(imageData)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `${photoType}.jpg`, {
          type: "image/jpeg",
        });

        if (photoType === "indoor") {
          setIndoorPhoto(file);
        } else {
          setOutdoorPhoto(file);
        }
      });

    setShowCamera(false);
  };

  const validatePDF = (
    file: File | null,
    setState: (file: File | null) => void,
  ) => {
    if (!file) return;

    if (file.size > MAX_SIZE) {
      Swal.fire("File too large", "Max 20MB allowed", "warning");
      setState(null);
      return;
    }
    if (file.type !== "application/pdf") {
      Swal.fire("Invalid file", "Only PDF is allowed.", "error");
      setState(null);
      return;
    }
  };

  const clearIndoorPhoto = () => {
    setIndoorPhoto(null);
    setIndoorPreview(null);
  };

  const clearOutdoorPhoto = () => {
    setOutdoorPhoto(null);
    setOutdoorPreview(null);
  };

  const documentTypes = [
    {
      value: "business_permit",
      label: "Business/Mayor's Permit",
      icon: FileText,
    },
    { value: "occupancy_permit", label: "Occupancy Permit", icon: FileCheck },
    { value: "property_title", label: "Property Title", icon: CreditCard },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ===== DOCUMENT TYPE SELECTION ===== */}
      <div id="doc-type-section">
        <SectionHeader
          number={1}
          icon={FileCheck}
          title="Document Type"
          subtitle="Select the type of legal document you'll upload"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {documentTypes.map((doc) => {
            const Icon = doc.icon;
            const active = docType === doc.value;
            return (
              <button
                key={doc.value}
                type="button"
                onClick={() => setDocType(doc.value)}
                className={`relative p-4 rounded-xl transition-all text-left ${
                  active
                    ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                {active && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
                <Icon
                  className={`w-6 h-6 mb-2 ${
                    active ? "text-white" : "text-blue-600"
                  }`}
                />
                <p className="text-sm font-semibold">{doc.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== DOCUMENT UPLOADS ===== */}
      <div id="document-uploads">
        <SectionHeader
          number={2}
          icon={Upload}
          title="Upload Documents"
          subtitle="Upload your legal documents for verification"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Legal Document */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-blue-600" />
              Legal Document (PDF)
              <span className="text-red-500">*</span>
            </label>
            <DropzoneUploader
              label=""
              file={submittedDoc}
              setFile={(file) => {
                if (file?.file) {
                  validatePDF(file.file, setSubmittedDoc);
                }
                setSubmittedDoc(file?.file || null);
              }}
              accept="application/pdf"
            />
            {submittedDoc && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="truncate">{submittedDoc.name}</span>
              </div>
            )}
          </div>

          {/* Government ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Government ID
              <span className="text-red-500">*</span>
            </label>
            <DropzoneUploader
              label=""
              file={govID}
              setFile={(file) => setGovID(file?.file || null)}
              accept="application/pdf,image/*"
            />
            {govID && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="truncate">{govID.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700">
              <p className="font-semibold">Accepted Documents:</p>
              <ul className="mt-1 space-y-0.5">
                <li>• Legal document must be in PDF format (max 20MB)</li>
                <li>• Government ID can be PDF or image (JPEG, PNG)</li>
                <li>• Ensure all documents are clear and readable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== VERIFICATION PHOTOS ===== */}
      <div id="photo-capture-section">
        <SectionHeader
          number={3}
          icon={Camera}
          title="Verification Photos"
          subtitle="Capture clear photos of your property for verification"
        />

        {/* Capture Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <button
            type="button"
            onClick={() => openCamera("indoor")}
            className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${
              indoorPhoto
                ? "border-emerald-300 bg-emerald-50"
                : "border-blue-300 bg-blue-50 hover:bg-blue-100"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                indoorPhoto
                  ? "bg-emerald-500"
                  : "bg-gradient-to-br from-blue-500 to-blue-600"
              }`}
            >
              {indoorPhoto ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="text-center">
              <p
                className={`text-sm font-semibold ${
                  indoorPhoto ? "text-emerald-700" : "text-blue-700"
                }`}
              >
                {indoorPhoto ? "Indoor Photo Captured" : "Capture Indoor Photo"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {indoorPhoto ? "Tap to retake" : "Required for verification"}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openCamera("outdoor")}
            className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${
              outdoorPhoto
                ? "border-emerald-300 bg-emerald-50"
                : "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                outdoorPhoto
                  ? "bg-emerald-500"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600"
              }`}
            >
              {outdoorPhoto ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="text-center">
              <p
                className={`text-sm font-semibold ${
                  outdoorPhoto ? "text-emerald-700" : "text-emerald-700"
                }`}
              >
                {outdoorPhoto
                  ? "Outdoor Photo Captured"
                  : "Capture Outdoor Photo"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {outdoorPhoto ? "Tap to retake" : "Required for verification"}
              </p>
            </div>
          </button>
        </div>

        {/* Photo Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Indoor Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Image className="w-4 h-4 text-blue-600" />
                Indoor Photo
              </label>
              {indoorPhoto && (
                <button
                  type="button"
                  onClick={clearIndoorPhoto}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
            {indoorPreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                <img
                  src={indoorPreview}
                  alt="Indoor preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-lg font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Indoor
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                <Camera className="w-8 h-8 mb-2" />
                <p className="text-sm">No indoor photo</p>
              </div>
            )}
          </div>

          {/* Outdoor Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Image className="w-4 h-4 text-emerald-600" />
                Outdoor Photo
              </label>
              {outdoorPhoto && (
                <button
                  type="button"
                  onClick={clearOutdoorPhoto}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
            {outdoorPreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                <img
                  src={outdoorPreview}
                  alt="Outdoor preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs rounded-lg font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Outdoor
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                <Camera className="w-8 h-8 mb-2" />
                <p className="text-sm">No outdoor photo</p>
              </div>
            )}
          </div>
        </div>

        {/* Validation Status */}
        {(!indoorPhoto || !outdoorPhoto) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-medium">
                Both indoor and outdoor photos are required for verification
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===== CAMERA MODAL ===== */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    photoType === "indoor" ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                >
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 capitalize">
                    {photoType} Photo
                  </h4>
                  <p className="text-xs text-gray-500">
                    Position your camera and capture
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCamera(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Component */}
            <div className="p-4">
              <CameraWeb onCapture={handleCapture} />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowCamera(false)}
                className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
