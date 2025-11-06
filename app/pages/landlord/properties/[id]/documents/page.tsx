"use client";

import { useParams } from "next/navigation";
import PropertyDocumentsTab from "@/components/landlord/properties/PropertyDocumentsTab";

export default function PropertyDocumentsPage() {
    const { id } = useParams();
    const property_id = id;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
            <div className="max-w-5xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    Property Documents
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                    Manage and upload essential documents for this property.
                </p>

                {/* Existing component (previously tab content) */}
                <PropertyDocumentsTab propertyId={property_id} />
            </div>
        </div>
    );
}
