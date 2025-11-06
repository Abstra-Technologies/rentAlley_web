"use client";

import React from "react";
import { useParams } from "next/navigation";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import { BackButton } from "@/components/navigation/backButton";
import PDCManagementPerProperty from "@/components/landlord/pdc/PDCManagementPerProperty";
import { FileText, Upload  } from "lucide-react";
import UploadPDCModal from "@/components/landlord/pdc/UploadPDCModalPerProperty";
import { useState } from "react";
export default function PDCPerPropertyPage() {
    const { id } = useParams();
    const propertyId = id as string;
    const [openUpload, setOpenUpload] = useState(false);

    console.log('pdc property:', propertyId);

    return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">

                {/* Header */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-5 sm:p-6 mb-6 mt-4">
                    {/* 🔹 Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Left — Icon + Title */}
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-sm flex-shrink-0">
                                <FileText className="h-5 w-5 text-white" />
                            </div>

                            <div>
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 leading-snug">
                                    Post-Dated Checks Management
                                </h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Review and manage all PDCs under this property.
                                </p>
                            </div>
                        </div>

                        {/* Right — Upload Button */}
                        <div className="flex sm:justify-end">
                            <button
                                onClick={() => setOpenUpload(true)}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:from-blue-700 hover:to-emerald-700 transition-all"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Upload PDCs</span>
                            </button>
                        </div>
                    </div>

                    {/* 🔹 Modal */}
                    <UploadPDCModal
                        isOpen={openUpload}
                        onClose={() => setOpenUpload(false)}
                        propertyId={propertyId}
                        onSuccess={() => fetchPDCs()} // refresh list after upload
                    />
                </div>


                {/* Main Content */}
                <PDCManagementPerProperty propertyId={propertyId} />
            </div>
    );
}
