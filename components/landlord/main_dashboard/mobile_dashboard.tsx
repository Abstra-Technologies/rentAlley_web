"use client";

import LandlordPropertyMarqueeMobile from "@/components/landlord/main_dashboard/LandlordPropertyMarqueeMobile";

interface Props {
    landlordId: string; // Required string – consistent with all other components
}

export default function MobileLandlordAnalytics({ landlordId }: Props) {
    return (
        <div className="block md:hidden w-full max-w-screen-sm mx-auto">
            {/* Title */}
            <div className="px-4 pt-4 pb-3">
                <h2 className="text-lg font-bold text-gray-800">
                    Quick Property View
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Tap any property to view details, tenants, and payments.
                </p>
            </div>

            {/* Property Marquee (Mobile Optimized) */}
            <LandlordPropertyMarqueeMobile landlordId={landlordId} />
        </div>
    );
}