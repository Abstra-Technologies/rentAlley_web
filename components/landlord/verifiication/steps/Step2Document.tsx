// components/landlordVerification/steps/Step2Document.jsx
"use client";

import {
    FiCamera,
    FiUpload,
    FiCheckCircle,
    FiAlertCircle,
    FiInfo,
} from "react-icons/fi";

import DocumentModal from "../ui/DocumentModal";
import DocumentCapture from "../camera/DocumentCapture";
import { DOCUMENT_TYPES } from "@/constant/docTypes";

export default function Step2Document({
                                          selectedDocument, setSelectedDocument,
                                          uploadOption, setUploadOption,
                                          uploadedFile, setUploadedFile,

                                          cameraAllowed, hasCamera, cameraError,
                                          webcamRef,

                                          captureGuidance, captureCountdown,
                                          isAnalyzing, capturedDocument, imageQuality,

                                          startAutoCapture, handleEnhancedCapture,

                                          setCapturedDocument, setImageQuality, setCaptureGuidance,

                                          isModalOpen, setIsModalOpen,
                                      }) {
    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <FiUpload className="w-6 h-6 text-blue-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">
                        Identity Document
                    </h2>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                    <FiInfo className="w-4 h-4 mr-1" />
                    What's accepted?
                </button>
            </div>

            {/* MODAL */}
            <DocumentModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* SELECT DOC TYPE */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Select Document Type
                </label>

                <select
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                    <option value="">Choose your document type...</option>
                    {DOCUMENT_TYPES.map((doc) => (
                        <option key={doc.value} value={doc.value}>
                            {doc.label}
                        </option>
                    ))}
                </select>
            </div>

            {selectedDocument && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-600">How would you like to provide your document?</p>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Upload */}
                        <button
                            onClick={() => setUploadOption("upload")}
                            className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                                uploadOption === "upload"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                            }`}
                        >
                            <FiUpload className="w-6 h-6 mx-auto mb-2" />
                            <p className="font-medium">Upload File</p>
                            <p className="text-xs opacity-75">From your device</p>
                        </button>

                        {/* Capture */}
                        <button
                            onClick={() => setUploadOption("capture")}
                            className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                                uploadOption === "capture"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                            }`}
                        >
                            <FiCamera className="w-6 h-6 mx-auto mb-2" />
                            <p className="font-medium">Take Photo</p>
                            <p className="text-xs opacity-75">Use camera</p>
                        </button>
                    </div>

                    {/* UPLOAD MODE */}
                    {uploadOption === "upload" && (
                        <div className="mt-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                                <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                                <input
                                    type="file"
                                    onChange={(e) => setUploadedFile(e.target.files[0])}
                                    accept="image/*"
                                    className="hidden"
                                    id="file-upload"
                                />

                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                >
                                    Choose File
                                </label>

                                <p className="text-sm text-gray-500 mt-2">
                                    PNG, JPG up to 10MB
                                </p>
                            </div>

                            {uploadedFile && (
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <div className="flex items-center">
                                        <FiCheckCircle className="w-5 h-5 text-emerald-600 mr-3" />
                                        <div>
                                            <p className="font-medium text-emerald-800">
                                                File uploaded successfully!
                                            </p>
                                            <p className="text-sm text-emerald-600">{uploadedFile.name}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CAMERA CAPTURE MODE */}
                    {uploadOption === "capture" && (
                        <DocumentCapture
                            cameraAllowed={cameraAllowed}
                            hasCamera={hasCamera}
                            cameraError={cameraError}
                            webcamRef={webcamRef}
                            captureGuidance={captureGuidance}
                            captureCountdown={captureCountdown}
                            isAnalyzing={isAnalyzing}
                            capturedDocument={capturedDocument}
                            imageQuality={imageQuality}
                            startAutoCapture={startAutoCapture}
                            handleEnhancedCapture={handleEnhancedCapture}
                            setCapturedDocument={setCapturedDocument}
                            setImageQuality={setImageQuality}
                            setCaptureGuidance={setCaptureGuidance}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
