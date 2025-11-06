"use client";

import { useParams } from "next/navigation";
import ConcessionaireBillingHistory from "@/components/landlord/properties/ConcessionaireBillingHistory";

export default function UtilityHistoryPage() {
    const { id } = useParams();
    const property_id = id;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 p-3 sm:p-6">
            <div className="w-full max-w-[95rem] mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                            Utility Cost History
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            View all historical utility cost for this property.
                        </p>
                    </div>
                </div>

                {/* Table Container */}
                <div className="w-full overflow-x-auto bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
                    <ConcessionaireBillingHistory propertyId={property_id} />
                </div>
            </div>
        </div>

    );
}
