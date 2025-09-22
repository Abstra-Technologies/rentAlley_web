"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

// @ts-ignore
const PropertyDocumentsTab = ({ propertyId }) => {
    const [docsData, setDocsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!propertyId) return;

        const fetchDocuments = async () => {
            try {
                const response = await axios.get(`/api/landlord/properties/docs/${propertyId}`);
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

    if (loading) {
        return <p className="text-gray-500 text-sm">Loading documents...</p>;
    }

    if (!docsData || docsData.length === 0) {
        return (
            <div className="text-center text-gray-500 text-sm py-4">
                No documents uploaded for this property.
            </div>
        );
    }

    const statusBadge = (status: string | null) => {
        if (!status) return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">Pending</span>;
        switch (status) {
            case "Verified":
                return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Verified</span>;
            case "Rejected":
                return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Rejected</span>;
            default:
                return <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">Pending</span>;
        }
    };

    // @ts-ignore
    const renderDocCard = (doc) => (
        <div
            key={doc.verification_id}
            className="p-4 border rounded-lg shadow-sm bg-white space-y-2"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-semibold capitalize">{doc.doc_type.replace("_", " ")}</h3>
                {statusBadge(doc.status)}
            </div>

            {/* Submitted Doc */}
            <p className="text-sm text-gray-600">Main Document:</p>
            {doc.submitted_doc ? (
                <a
                    href={doc.submitted_doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                >
                    View Document
                </a>
            ) : (
                <span className="text-gray-400 italic text-sm">Not uploaded</span>
            )}

            {/* Government ID */}
            <p className="text-sm text-gray-600">Government ID:</p>
            {doc.gov_id ? (
                <a
                    href={doc.gov_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                >
                    View Gov ID
                </a>
            ) : (
                <span className="text-gray-400 italic text-sm">Not uploaded</span>
            )}

            {/* Photos */}
            <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                    <p className="text-sm text-gray-600">Outdoor Photo:</p>
                    {doc.outdoor_photo ? (
                        <a
                            href={doc.outdoor_photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                        >
                            View
                        </a>
                    ) : (
                        <span className="text-gray-400 italic text-sm">N/A</span>
                    )}
                </div>
                <div>
                    <p className="text-sm text-gray-600">Indoor Photo:</p>
                    {doc.indoor_photo ? (
                        <a
                            href={doc.indoor_photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                        >
                            View
                        </a>
                    ) : (
                        <span className="text-gray-400 italic text-sm">N/A</span>
                    )}
                </div>
            </div>

            {/* Admin message if rejected */}
            {doc.admin_message && (
                <p className="text-xs text-red-600 mt-2">
                    <strong>Admin Message:</strong> {doc.admin_message}
                </p>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Property Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docsData.map((doc) => renderDocCard(doc))}
            </div>
        </div>
    );
};

export default PropertyDocumentsTab;
