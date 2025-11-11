"use client";

import React from "react";
import { useParams } from "next/navigation";
import PDCManagementPerProperty from "@/components/landlord/pdc/PDCManagementPerProperty";
import { FileText, Upload } from "lucide-react";
import UploadPDCModal from "@/components/landlord/pdc/UploadPDCModalPerProperty";
import { useState } from "react";

export default function PDCPerPropertyPage() {
  const { id } = useParams();
  const propertyId = id as string;
  const [openUpload, setOpenUpload] = useState(false);

  console.log("pdc property:", propertyId);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Post-Dated Checks Management
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  Review and manage all PDCs under this property
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpenUpload(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload PDCs
            </button>
          </div>
        </div>

        {/* Main Content */}
        <PDCManagementPerProperty propertyId={Number(propertyId)} />

        {/* Modal */}
        <UploadPDCModal
          isOpen={openUpload}
          onClose={() => setOpenUpload(false)}
          propertyId={propertyId}
          onSuccess={() => {
            // The component will auto-refresh via useEffect
            setOpenUpload(false);
          }}
        />
      </div>
    </div>
  );
}
