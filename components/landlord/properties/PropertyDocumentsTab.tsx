"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Image as ImageIcon,
  CreditCard,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Document {
  verification_id: string | number;
  doc_type: string;
  status: string | null;
  submitted_doc: string | null;
  gov_id: string | null;
  outdoor_photo: string | null;
  indoor_photo: string | null;
  admin_message: string | null;
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
        setDocsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [propertyId]);

  const getStatusConfig = (status: string | null) => {
    if (!status || status === "Pending") {
      return {
        icon: <Clock className="w-4 h-4" />,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Pending",
      };
    }
    switch (status) {
      case "Verified":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Verified",
        };
      case "Rejected":
        return {
          icon: <XCircle className="w-4 h-4" />,
          className: "bg-red-50 text-red-700 border-red-200",
          label: "Rejected",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          className: "bg-amber-50 text-amber-700 border-amber-200",
          label: "Pending",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-4 w-full">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-48 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!docsData || docsData.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-gray-900 font-semibold text-lg mb-1">
          No Documents Yet
        </p>
        <p className="text-gray-500 text-sm">
          Documents uploaded for this property will appear here.
        </p>
      </div>
    );
  }

  const renderDocCard = (doc: Document) => {
    const statusConfig = getStatusConfig(doc.status);

    return (
      <div
        key={doc.verification_id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-5 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900 capitalize">
                {doc.doc_type.replace(/_/g, " ")}
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full border ${statusConfig.className}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Main Document */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Main Document
              </p>
              {doc.submitted_doc ? (
                <a
                  href={doc.submitted_doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm transition-colors border border-blue-200 w-full justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span>View Document</span>
                  </div>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-5 h-5" />
                  <span className="italic">Not uploaded</span>
                </div>
              )}
            </div>

            {/* Government ID */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Government ID
              </p>
              {doc.gov_id ? (
                <a
                  href={doc.gov_id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm transition-colors border border-blue-200 w-full justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    <span>View Government ID</span>
                  </div>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CreditCard className="w-5 h-5" />
                  <span className="italic">Not uploaded</span>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Property Photos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Outdoor Photo */}
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  Outdoor
                </p>
                {doc.outdoor_photo ? (
                  <a
                    href={doc.outdoor_photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-blue-300 group"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>View Photo</span>
                    <ExternalLink className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <ImageIcon className="w-5 h-5" />
                    <span className="italic">Not available</span>
                  </div>
                )}
              </div>

              {/* Indoor Photo */}
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">Indoor</p>
                {doc.indoor_photo ? (
                  <a
                    href={doc.indoor_photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-blue-300 group"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>View Photo</span>
                    <ExternalLink className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <ImageIcon className="w-5 h-5" />
                    <span className="italic">Not available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Message */}
          {doc.admin_message && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">
                    Admin Message
                  </p>
                  <p className="text-sm text-red-700">{doc.admin_message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Property Documents
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {docsData.length} document{docsData.length !== 1 ? "s" : ""}{" "}
            uploaded
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {docsData.map((doc) => renderDocCard(doc))}
      </div>
    </div>
  );
};

export default PropertyDocumentsTab;
