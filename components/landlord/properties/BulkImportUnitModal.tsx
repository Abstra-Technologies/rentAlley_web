"use client";

import React, { useState } from "react";
import axios from "axios";

export default function BulkImportUnitModal({
                                                isOpen,
                                                onClose,
                                                propertyId,
                                            }: {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("property_id", propertyId);

            await axios.post("/api/landlord/properties/bulkUpload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setIsUploading(false);
            onClose();
        } catch (error) {
            console.error("Bulk upload failed:", error);
            setIsUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.open(
            "https://docs.google.com/spreadsheets/d/1uygqMR9nkVcn3iX71hno25zz15aapJtgcuMRCh3k5ts/edit?usp=sharing",
            "_blank"
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 relative border border-gray-200">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    ✕
                </button>

                {/* Header */}
                <h2 className="text-xl font-bold text-gray-800 mb-2">Bulk Import Units</h2>
                <p className="text-sm text-gray-600 mb-5">
                    Download the template, fill in your units, then upload it here.
                </p>

                {/* Download Template Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                        Step 1 — Download Template
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                        Use this spreadsheet to input your unit list.
                    </p>

                    <button
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm
                                   hover:bg-emerald-700 transition w-full"
                    >
                        Download Google Sheets Template
                    </button>
                </div>

                {/* File input */}
                <h3 className="text-sm font-medium text-gray-800 mb-2">
                    Step 2 — Upload Filled Template
                </h3>
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />

                {/* Upload button */}
                <button
                    disabled={isUploading || !file}
                    onClick={handleUpload}
                    className="mt-5 w-full py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {isUploading ? "Uploading..." : "Upload File"}
                </button>
            </div>
        </div>
    );
}
