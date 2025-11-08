"use client";

import { useParams } from "next/navigation";
import ConcessionaireBillingHistory from "@/components/landlord/properties/ConcessionaireBillingHistory";
import { Zap, Droplets } from "lucide-react";

export default function UtilityHistoryPage() {
  const { id } = useParams();
  const property_id = id;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Utility Cost History
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                View all historical utility costs for this property
              </p>
            </div>
          </div>
        </div>

        {/* Component */}
        <ConcessionaireBillingHistory propertyId={property_id} />
      </div>
    </div>
  );
}
