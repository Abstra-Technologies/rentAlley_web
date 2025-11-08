"use client";

import { useParams } from "next/navigation";
import PropertyDocumentsTab from "@/components/landlord/properties/PropertyDocumentsTab";

export default function PropertyDocumentsPage() {
  const { id } = useParams();
  const property_id = id;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        <PropertyDocumentsTab propertyId={property_id} />
      </div>
    </div>
  );
}
