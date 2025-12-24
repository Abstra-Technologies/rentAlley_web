"use client";

import { FiEye, FiShield } from "react-icons/fi";
import { DOCUMENT_TYPES } from "@/constant/docTypes";

export default function StepReview(props: any) {
    const {
        firstName,
        lastName,
        dateOfBirth,
        address,
        citizenship,
        selectedDocument,
        uploadedFile,
        capturedDocument,
        selfie,
    } = props;

    const documentLabel =
        DOCUMENT_TYPES.find(d => d.value === selectedDocument)?.label || "—";

    return (
        <section className="space-y-6">
            <div className="flex items-center mb-6">
                <FiEye className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                    Review & Submit
                </h2>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <p><strong>Name:</strong> {firstName} {lastName}</p>
                <p><strong>DOB:</strong> {dateOfBirth}</p>
                <p><strong>Address:</strong> {address}</p>
                <p><strong>Citizenship:</strong> {citizenship}</p>
                <p><strong>Document:</strong> {documentLabel}</p>

                {/* Document source */}
                {uploadedFile && (
                    <p className="text-sm text-gray-600">
                        <strong>Uploaded file:</strong>{" "}
                        {(uploadedFile as File).name}
                    </p>
                )}

                {capturedDocument && typeof capturedDocument === "string" && (
                    <img
                        src={capturedDocument}
                        alt="Captured document preview"
                        className="mt-3 w-40 rounded-lg border"
                    />
                )}

                {selfie && typeof selfie === "string" && (
                    <img
                        src={selfie}
                        alt="Selfie preview"
                        className="mt-3 w-32 rounded-lg border"
                    />
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
                <FiShield className="mr-2 mt-0.5 text-blue-600" />
                <span className="text-blue-700 text-sm">
                    Your documents are encrypted and securely processed.
                </span>
            </div>
        </section>
    );
}
