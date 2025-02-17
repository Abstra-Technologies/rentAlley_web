"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuth from "../../../../../hooks/useSession";
import Webcam from "react-webcam";
import { DOCUMENT_TYPES } from "../../../../constant/docTypes";

export default function LandlordVerification() {
    const { user, loading, error } = useAuth();
    const [landlordId, setLandlordId] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        fullName: "",
        homeAddress: "",
        birthDate: "",
        nationality: "",
    });

    const [selectedDocument, setSelectedDocument] = useState("");
    const [uploadOption, setUploadOption] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [capturedDocument, setCapturedDocument] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const webcamRef = useRef(null);

    useEffect(() => {
        if (user?.userType === "landlord") {
            fetch(`/api/landlord/${user.landlord_id}`)
                .then((res) => res.json())
                .then((data) => {
                    setLandlordId(data.landlord_id);
                    setFormData({
                        fullName: `${user.firstName} ${user.lastName}` || "",
                        homeAddress: user.homeAddress || "",
                        birthDate: user.birthDate || "",
                        nationality: user.nationality || "",
                    });
                })
                .catch((err) => console.error("Error fetching landlord data:", err));
        }
    }, [user]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!user) return <p>You need to log in to access this page.</p>;

    const userId = user.userID;

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

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
        }
    };

    const handleSubmit = async () => {
        if (!selfie || !(uploadedFile || capturedDocument)) {
            alert("Please complete all verification steps.");
            return;
        }

        const formSubmission = new FormData();
        formSubmission.append("fullName", formData.fullName);
        formSubmission.append("homeAddress", formData.homeAddress);
        formSubmission.append("birthDate", formData.birthDate);
        formSubmission.append("nationality", formData.nationality);
        formSubmission.append("documentType", selectedDocument);
        if (uploadedFile) {
            formSubmission.append("uploadedFile", uploadedFile);
        } else if (capturedDocument) {
            formSubmission.append("capturedDocument", capturedDocument);
        }
        formSubmission.append("selfie", selfie);
        formSubmission.append("user_id", userId);
        formSubmission.append("landlord_id", landlordId);

        try {
            const response = await fetch("/api/landlord/verifyupload", {
                method: "POST",
                body: formSubmission,
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (!response.ok) {
                throw new Error("Upload failed!");
            }

            alert("Verification documents submitted successfully!");
        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Landlord Verification</h1>


            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold">Step 1: Verify Personal Details</h2>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="border p-2 w-full rounded mt-2" placeholder="Full Legal Name" required />
                    <input type="text" name="homeAddress" value={formData.homeAddress} onChange={handleInputChange} className="border p-2 w-full rounded mt-2" placeholder="Home Address" required />
                    <input
                        type="date"
                        value={user.birthDate ? new Date(user.birthDate).toISOString().split("T")[0] : ""}
                        readOnly
                    />
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} className="border p-2 w-full rounded mt-2" placeholder="Nationality" required />
                    <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded" onClick={() => setCurrentStep(2)}>Next</button>
                </div>
            )}

            {currentStep === 2 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold">Step 2: Upload or Capture Document</h2>
                    <select className="border p-2 rounded w-full mt-2" value={selectedDocument} onChange={handleDocumentChange} required>
                        <option value="">-- Select Document Type --</option>
                        {DOCUMENT_TYPES.map((doc) => (
                            <option key={doc.value} value={doc.value}>{doc.label}</option>
                        ))}
                    </select>
                    <button onClick={() => setUploadOption("upload")} className="bg-gray-300 p-2 rounded mt-2">Upload</button>
                    <button onClick={() => setUploadOption("capture")} className="bg-gray-300 p-2 rounded mt-2">Capture</button>

                    {uploadOption === "upload" && <input type="file" onChange={handleFileUpload} required />}
                    {uploadOption === "capture" && <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />}
                    {capturedDocument && <img src={capturedDocument} alt="Captured Document Preview" />}
                    <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded" onClick={() => setCurrentStep(3)}>Next</button>
                </div>
            )}
            {currentStep === 3 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold">Step 3: Capture Selfie</h2>
                    <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
                    <button onClick={captureSelfie} className="bg-gray-500 text-white px-4 py-2 mt-2 rounded">Capture Selfie</button>
                    {selfie && <img src={selfie} alt="Selfie Preview" />}
                    <button className="bg-green-500 text-white px-4 py-2 mt-4 rounded" onClick={handleSubmit}>Submit</button>
                </div>
            )}
        </div>
    );
}
