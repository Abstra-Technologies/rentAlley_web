"use client";

import LandlordPropertyMarquee from "@/components/landlord/main_dashboard/LandlordPropertyQuickView";

export default function MobileLandlordAnalytics({ user }) {
    return (
        <div className="sm:hidden">
            {/* Title */}
            <div className="px-4 pt-4 pb-2">
                <h2 className="text-lg font-bold text-gray-800">
                    Quick Property View
                </h2>
                <p className="text-sm text-gray-500">
                    Access your properties quickly on mobile.
                </p>
            </div>

            {/* Property Quick Cards */}
            <div className="p-4 space-y-4">
                <LandlordPropertyMarquee landlordId={user?.landlord_id} />
            </div>
        </div>
    );
}
