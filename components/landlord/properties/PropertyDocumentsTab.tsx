"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Image as ImageIcon,
  CreditCard,
  Download,
  ExternalLink,
} from "lucide-react";

interface Document {
  verification_id: string | number;
  doc_type: string;
  status: string | null;
  submitted_doc: string | null;
}

interface PropertyDocumentsTabProps {
  propertyId: string | string[];
}

const PropertyDocumentsTab: React.FC<PropertyDocumentsTabProps> = ({
  propertyId,
}) => {
  const [docsData, setDocsData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;

    const fetchDocuments = async () => {
      try {
        const response = await axios.get(
          `/api/landlord/properties/docs/${propertyId}`
        );
        setDocsData(response.data || []);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [propertyId]);

  const getStaticThumb = (docType: string, url: string | null) => {
    if (!url)
      return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/placeholder.webp";

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.endsWith(".pdf"))
      return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/pdf-2127829_960_720_pi4t2s.webp";

    if (lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".docx"))
      return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/doc-icon.webp";

    if (docType.toLowerCase().includes("id"))
      return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/id-icon.webp";

    if (docType.toLowerCase().includes("photo"))
      return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/image-icon.webp";

    return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/doc-default.webp";
  };

  const getStaticIcon = (type: string) => {
    if (type.includes("photo")) return <ImageIcon className="w-5 h-5" />;
    if (type.includes("id")) return <CreditCard className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!docsData.length) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-gray-900 font-semibold text-base mb-1">
          No Documents Uploaded
        </p>
        <p className="text-gray-500 text-sm">
          Property documents will appear here once uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Property Documents
          </h2>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">
            {docsData.length} {docsData.length === 1 ? "file" : "files"}{" "}
            uploaded
          </p>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {docsData.map((doc) => (
          <a
            href={doc.submitted_doc || "#"}
            key={doc.verification_id}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="h-32 md:h-36 bg-gray-50 flex items-center justify-center overflow-hidden relative">
              <img
                src={getStaticThumb(doc.doc_type, doc.submitted_doc)}
                alt={doc.doc_type}
                className="w-16 h-16 md:w-20 md:h-20 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-blue-600 flex-shrink-0">
                  {getStaticIcon(doc.doc_type)}
                </div>
                <span className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-1 capitalize">
                  {doc.doc_type.replace(/_/g, " ")}
                </span>
              </div>
              {doc.status && (
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    doc.status.toLowerCase() === "verified"
                      ? "bg-emerald-50 text-emerald-700"
                      : doc.status.toLowerCase() === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {doc.status}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default PropertyDocumentsTab;
