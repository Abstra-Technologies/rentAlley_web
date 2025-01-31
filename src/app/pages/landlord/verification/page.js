"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuth from "../../../../../hooks/useSession";
import Webcam from "react-webcam";
import {DOCUMENT_TYPES} from "../../../../constant/docTypes"; // Import document types

export default function LandlordDashboard() {
    const { user, loading, error, signOut } = useAuth();
    const [landlordId, setLandlordId] = useState(null);
    const [currentStep, setCurrentStep] = useState(1); // Step tracker
    const [selectedDocument, setSelectedDocument] = useState(""); // Store document type
    const [uploadOption, setUploadOption] = useState(""); // Store chosen method (Upload/Capture)
    const [uploadedFile, setUploadedFile] = useState(null);
    const [capturedDocument, setCapturedDocument] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const webcamRef = useRef(null);

    useEffect(() => {
        if (user?.userType === "landlord") {
            fetch(`/api/landlord/${user.userID}`)
                .then((res) => res.json())
                .then((data) => {
                    setLandlordId(data.landlord_id);
                })
                .catch((err) => console.error("Error fetching landlord data:", err));
        }
    }, [user]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!user) return <p>You need to log in to access the dashboard.</p>;

    const userId = user.userID;

    // Handle document selection
    const handleDocumentChange = (event) => {
        setSelectedDocument(event.target.value);
    };

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        setUploadedFile(file);
    };

    // Capture document using webcam
    const captureDocument = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedDocument(imageSrc);
        }
    };

    // Capture selfie
    const captureSelfie = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setSelfie(imageSrc);
        }
    };

    // Submit verification data
    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append("documentType", selectedDocument);
        if (uploadedFile) {
            formData.append("uploadedFile", uploadedFile);
        } else if (capturedDocument) {
            formData.append("capturedDocument", capturedDocument);
        }
        formData.append("selfie", selfie);
        formData.append("user_id", userId);
        formData.append("landlord_id", landlordId);

        try {
            const response = await fetch("/api/landlord/verifyupload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed!");
            }

            alert("Upload successful!");
        } catch (error) {
            console.error(error);
            alert("Something went wrong!");
        }
    };

    return (
        <div>
            <h1>Landlord Verification</h1>
            <p>User ID: {user.userID}</p>
            {landlordId && <p>Your Landlord ID: {landlordId}</p>}

            {/* Step 1: Select Document Type */}
            {currentStep === 1 && (
                <div>
                    <h2>Step 1: Select Document Type</h2>
                    <select value={selectedDocument} onChange={handleDocumentChange} required>
                        <option value="">-- Select Document Type --</option>
                        {DOCUMENT_TYPES.map((doc) => (
                            <option key={doc.value} value={doc.value}>
                                {doc.label}
                            </option>
                        ))}
                    </select>
                    <button onClick={() => setCurrentStep(2)} disabled={!selectedDocument}>
                        Next
                    </button>
                </div>
            )}

            {/* Step 2: Choose Upload or Capture */}
            {currentStep === 2 && (
                <div>
                    <h2>Step 2: Upload or Capture {DOCUMENT_TYPES.find((doc) => doc.value === selectedDocument)?.label}</h2>
                    <div>
                        <button onClick={() => setUploadOption("upload")}>Upload</button>
                        <button onClick={() => setUploadOption("capture")}>Capture</button>
                    </div>

                    {/* Upload File */}
                    {uploadOption === "upload" && (
                        <div>
                            <input type="file" onChange={handleFileUpload} required />
                            {uploadedFile && <p>File uploaded: <strong>{uploadedFile.name}</strong></p>}
                        </div>
                    )}

                    {/* Capture Document */}
                    {uploadOption === "capture" && (
                        <div>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                            />
                            <button onClick={captureDocument}>Capture Document</button>
                            {capturedDocument && (
                                <>
                                    <p>Document captured!</p>
                                    <img src={capturedDocument} alt="Document Preview" />
                                </>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setCurrentStep(3)}
                        disabled={!uploadedFile && !capturedDocument}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Step 3: Capture Selfie */}
            {currentStep === 3 && (
                <div>
                    <h2>Step 3: Capture Selfie</h2>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                    />
                    <button onClick={captureSelfie}>Capture Selfie</button>
                    {selfie && (
                        <>
                            <p>Selfie captured!</p>
                            <img src={selfie} alt="Selfie Preview" />
                            <button onClick={() => setCurrentStep(4)}>
                                Next
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Step 4: Review and Submit */}
            {currentStep === 4 && (
                <div>
                    <h2>Step 4: Review and Submit</h2>
                    <p><strong>Selected Document Type:</strong> {DOCUMENT_TYPES.find((doc) => doc.value === selectedDocument)?.label}</p>
                    {uploadedFile && <p><strong>Uploaded File:</strong> {uploadedFile?.name}</p>}
                    {capturedDocument && (
                        <>
                            <p><strong>Captured Document:</strong></p>
                            <img src={capturedDocument} alt="Captured Document Preview" />
                        </>
                    )}
                    <p><strong>Selfie:</strong></p>
                    <img src={selfie} alt="Selfie Preview" />
                    <button onClick={handleSubmit}>Submit</button>
                </div>
            )}
        </div>
    );
}
