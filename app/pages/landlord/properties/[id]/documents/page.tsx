"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { FolderOpen, FileText, CreditCard, UserCircle } from "lucide-react";

export default function PropertyDocumentsPage() {
  const { id } = useParams();
  const property_id = id;

  const folders = [
    {
      title: "Property Documents",
      description:
        "Property title, permits, verification documents, property photos",
      icon: FileText,
      href: `/pages/landlord/properties/${property_id}/documents/property`,
      color: "from-blue-600 to-blue-700",
      count: "—",
    },
    {
      title: "Tenant Documents",
      description:
        "Tenant IDs, proof of income, lease agreements, move-in checklist",
      icon: UserCircle,
      href: `/pages/landlord/properties/${property_id}/documents/tenant`,
      color: "from-emerald-600 to-emerald-700",
      count: "—",
    },
    {
      title: "Payment Proofs",
      description: "Receipts, payment confirmations, PDC images",
      icon: CreditCard,
      href: `/pages/landlord/properties/${property_id}/documents/payments`,
      color: "from-purple-600 to-purple-700",
      count: "—",
    },
  ];

  return (
    <div className="pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Documents
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                Organized repository of all property, tenant, and
                payment-related documents
              </p>
            </div>
          </div>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder, idx) => {
            const Icon = folder.icon;
            return (
              <Link
                key={idx}
                href={folder.href}
                className="group bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Folder Icon */}
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${folder.color} flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Title + Description */}
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                  {folder.title}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {folder.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
