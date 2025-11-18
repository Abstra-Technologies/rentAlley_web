"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    FileText,
    Image as ImageIcon,
    CreditCard,
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

        // Photo
        if (docType.toLowerCase().includes("photo"))
            return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/image-icon.webp";

        // Default
        return "https://res.cloudinary.com/dptmeluy0/image/upload/v1763439990/doc-default.webp";
    };


    const statusColor = {
        Pending: "bg-amber-100 text-amber-700 border-amber-300",
        Verified: "bg-emerald-100 text-emerald-700 border-emerald-300",
        Rejected: "bg-red-100 text-red-700 border-red-300",
    };

    const getStaticIcon = (type: string) => {
        if (type.includes("photo")) return <ImageIcon className="w-6 h-6" />;
        if (type.includes("id")) return <CreditCard className="w-6 h-6" />;
        return <FileText className="w-6 h-6" />;
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    if (!docsData.length)
        return (
            <div className="text-center py-10 border border-dashed rounded-xl">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="font-semibold text-gray-700">No Documents Uploaded</p>
            </div>
        );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Property Documents</h2>
                    <p className="text-gray-600 text-sm">{docsData.length} files</p>
                </div>
            </div>

            {/* Google Drive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {docsData.map((doc) => (
                    <a
                        href={doc.submitted_doc || "#"}
                        key={doc.verification_id}
                        target="_blank"
                        className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-0 overflow-hidden"
                    >
                        {/* Static Thumbnail */}
                        <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img
                                src={getStaticThumb(doc.doc_type, doc.submitted_doc)}
                                className="w-20 h-20 object-contain opacity-90 group-hover:opacity-100 transition"
                            />
                        </div>

                        {/* Info */}
                        <div className="p-3">
                            <div className="flex items-center gap-2">
                                {getStaticIcon(doc.doc_type)}
                                <span className="text-sm font-semibold line-clamp-1 capitalize">
                  {doc.doc_type.replace(/_/g, " ")}
                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default PropertyDocumentsTab;
