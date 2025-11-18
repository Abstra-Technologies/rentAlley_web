"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
    FolderIcon,
    DocumentIcon,
    CreditCardIcon,
    UserCircleIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

export default function PropertyDocumentsPage() {
    const { id } = useParams();
    const property_id = id;

    const folders = [
        {
            title: "Property Documents",
            description: "Property title, permits, verification documents, property photos",
            icon: FolderIcon,
            href: `/pages/landlord/properties/${property_id}/documents/property`,
            color: "from-blue-500 to-blue-600",
        },
        {
            title: "Tenant Documents",
            description: "Tenant IDs, proof of income, lease agreements, move-in checklist",
            icon: UserCircleIcon,
            href: `/pages/landlord/properties/${property_id}/documents/tenant`,
            color: "from-emerald-500 to-emerald-600",
        },
        {
            title: "Payment Proofs",
            description: "Receipts, payment confirmations, PDC images",
            icon: CreditCardIcon,
            href: `/pages/landlord/properties/${property_id}/documents/payments`,
            color: "from-purple-500 to-purple-600",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
            <div className="w-full px-4 md:px-6 pt-20 md:pt-8">

                {/* PAGE HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Organized repository of all property, tenant, and payment-related documents.
                    </p>
                </div>

                {/* FOLDERS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {folders.map((folder, idx) => {
                        const Icon = folder.icon;
                        return (
                            <Link
                                key={idx}
                                href={folder.href}
                                className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                {/* Folder Icon */}
                                <div
                                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${folder.color} flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform`}
                                >
                                    <Icon className="h-6 w-6 text-white" />
                                </div>

                                {/* Title + Description */}
                                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-gray-900">
                                    {folder.title}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 leading-snug">
                                    {folder.description}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                {/* If you want the old component to appear under a folder */}
                {/* <PropertyDocumentsTab propertyId={property_id} /> */}

            </div>
        </div>
    );
}
