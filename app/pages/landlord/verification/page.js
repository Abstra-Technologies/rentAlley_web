"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuth from "../../../../hooks/useSession";
import Webcam from "react-webcam";
import { DOCUMENT_TYPES } from "../../../../constant/docTypes";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiInfo } from "react-icons/fi";
import LoadingScreen from "../../../../components/loadingScreen";

export default function LandlordDashboard() {
  const router = useRouter();
  const { user, error } = useAuth();
  const [landlordId, setLandlordId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [uploadOption, setUploadOption] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [capturedDocument, setCapturedDocument] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const webcamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user?.userType === "landlord") {
      setDataLoading(true);
      fetch(`/api/landlord/${user.landlord_id}`)
        .then((res) => res.json())
        .then((data) => {
          setLandlordId(data.landlord_id);
          setFullName(`${user.firstName} ${user.lastName}`);
          setDateOfBirth(user.birthDate);
        })
        .catch((err) => console.error("Error fetching landlord data:", err)).finally(() => { setDataLoading(false);
      })
    }
  }, [user]);

  if(dataLoading) return  <LoadingScreen />;
  if (error) return <p>{error}</p>;
  if (!user) return <p>You need to log in to access the dashboard.</p>;

  const handleDocumentChange = (event) => {
    setSelectedDocument(event.target.value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadedFile(file);
  };

  const captureDocument = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedDocument(imageSrc);
    }
  };

  const captureSelfie = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setSelfie(imageSrc);
      setIsCameraOpen(false);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("documentType", selectedDocument);
    if (uploadedFile) {
      formData.append("uploadedFile", uploadedFile);
    } else if (capturedDocument) {
      formData.append("capturedDocument", capturedDocument);
    }
    formData.append("selfie", selfie);
    formData.append("landlord_id", landlordId);
    formData.append("fullName", fullName);
    formData.append("address", address);
    formData.append("dateOfBirth", dateOfBirth);
    formData.append("citizenship", citizenship);

    try {
      const response = await fetch("/api/landlord/verification-upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        new Error("Upload failed!");
      }
      Swal.fire("Success!", "Verification Submitted!", "success");
      router.push("/pages/landlord/dashboard");
    } catch (error) {
      Swal.fire("Error", `Something went wrong: ${error.message}`, "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl md:max-w-2xl sm:max-w-md">
        <h1 className="text-2xl font-bold mb-4">Landlord Verification</h1>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span
              className={`text-gray-500 ${
                currentStep === 1 ? "font-bold" : ""
              }`}
            >
              Step 1
            </span>
            <span
              className={`text-gray-500 ${
                currentStep === 2 ? "font-bold" : ""
              }`}
            >
              Step 2
            </span>
            <span
              className={`text-gray-500 ${
                currentStep === 3 ? "font-bold" : ""
              }`}
            >
              Step 3
            </span>
            <span
              className={`text-gray-500 ${
                currentStep === 4 ? "font-bold" : ""
              }`}
            >
              Step 4
            </span>
          </div>
          <div className="bg-gray-200 h-1">
            <div
              className={`h-1 bg-blue-500`}
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 1: Personal Information
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                placeholder="Please input your full name"
                required
                readOnly={true}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Home Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Please input your home address."
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={
                  user.birthDate
                    ? new Date(user.birthDate).toISOString().split("T")[0]
                    : ""
                }
                readOnly
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Place of Birth</label>
              <input
                type="text"
                value={citizenship}
                onChange={(e) => setCitizenship(e.target.value)}
                placeholder="Please input your place of birth."
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        )}

        {/* Step 2: Select Document Type */}

        {currentStep === 2 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Step 2: Select Document Type
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white p-2 rounded-full text-sm flex items-center"
              >
                <FiInfo className="w-5 h-5" />
              </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                  <h3 className="text-lg font-semibold mb-2">Accepted IDs:</h3>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Passport</li>
                    <li>National ID</li>
                    <li>Driver License</li>
                    <li>State Identification Cards</li>
                  </ul>
                  <h3 className="text-lg font-semibold mt-3 mb-2 text-red-500">
                    Not Accepted:
                  </h3>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Membership Cards</li>
                    <li>School ID</li>
                    <li>Any other similar ID</li>
                  </ul>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-4 w-full bg-gray-500 text-white p-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Document Selection */}
            <select
              value={selectedDocument}
              onChange={handleDocumentChange}
              required
              className="w-full p-2 border border-gray-300 rounded mb-4"
            >
              <option value="">-- Select Document Type --</option>
              {DOCUMENT_TYPES.map((doc) => (
                <option key={doc.value} value={doc.value}>
                  {doc.label}
                </option>
              ))}
            </select>

            {/* Upload or Capture */}
            <div className="mb-4">
              <button
                onClick={() => setUploadOption("upload")}
                className="w-full bg-blue-500 text-white p-2 rounded mb-2"
              >
                Upload
              </button>
              <button
                onClick={() => setUploadOption("capture")}
                className="w-full bg-blue-500 text-white p-2 rounded"
              >
                Capture
              </button>
            </div>

            {/* Upload File */}
            {uploadOption === "upload" && (
              <div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  required
                  className="w-full p-2 border border-gray-300 rounded mb-4"
                />
                {uploadedFile && (
                  <p className="mb-4">
                    File uploaded: <strong>{uploadedFile.name}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Capture Document */}
            {uploadOption === "capture" && (
              <div>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="mb-4"
                />
                <button
                  onClick={captureDocument}
                  className="w-full bg-blue-500 text-white p-2 rounded mb-4"
                >
                  Capture Document
                </button>
                {capturedDocument && (
                  <>
                    <p className="mb-4">Document captured!</p>
                    <img
                      src={capturedDocument}
                      alt="Document Preview"
                      className="mb-4"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Capture Selfie */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 3: Capture Selfie
            </h2>

            {isCameraOpen ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="mb-4"
                />
                <button
                  onClick={captureSelfie}
                  className="w-full bg-blue-500 text-white p-2 rounded mb-4"
                >
                  Capture Selfie
                </button>
              </>
            ) : selfie ? (
              <>
                <p className="mb-4">Selfie captured!</p>
                <img src={selfie} alt="Selfie Preview" className="mb-4" />
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full bg-gray-500 text-white p-2 rounded mb-4"
                >
                  Retake Selfie
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsCameraOpen(true)}
                className="w-full bg-blue-500 text-white p-2 rounded mb-4"
              >
                Open Camera
              </button>
            )}
          </div>
        )}

        {/* Step 4: Review and Submit */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 4: Review and Submit
            </h2>
            <p className="mb-4">
              <strong>Full Legal Name:</strong> {fullName}
            </p>
            <p className="mb-4">
              <strong>Home Address:</strong> {address}
            </p>
            <p className="mb-4">
              <strong>Date of Birth:</strong> {dateOfBirth}
            </p>
            <p className="mb-4">
              <strong>Place of Birth:</strong> {citizenship}
            </p>
            <p className="mb-4">
              <strong>Selected Document Type:</strong>{" "}
              {
                DOCUMENT_TYPES.find((doc) => doc.value === selectedDocument)
                  ?.label
              }
            </p>
            {uploadedFile && (
              <p className="mb-4">
                <strong>Uploaded File:</strong> {uploadedFile?.name}
              </p>
            )}
            {capturedDocument && (
              <>
                <p className="mb-4">
                  <strong>Captured Document:</strong>
                </p>
                <img
                  src={capturedDocument}
                  alt="Captured Document Preview"
                  className="mb-4"
                />
              </>
            )}
            <p className="mb-4">
              <strong>Selfie:</strong>
            </p>
            <img src={selfie} alt="Selfie Preview" className="mb-4" />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Previous
            </button>
          )}
          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 &&
                  (!fullName ||
                    !address ||
                    !dateOfBirth ||
                    !citizenship)) ||
                (currentStep === 2 && !selectedDocument) ||
                (currentStep === 2 && !uploadedFile && !capturedDocument) ||
                (currentStep === 3 && !selfie)
              }
              className="bg-blue-500 text-white p-2 rounded"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
