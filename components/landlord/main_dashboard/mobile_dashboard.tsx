"use client";

import LandlordPropertyMarqueeMobile from "@/components/landlord/main_dashboard/LandlordPropertyMarqueeMobile";

export default function MobileLandlordAnalytics({ user }) {
    return (
        <div className="block md:hidden w-full max-w-screen-sm mx-auto">
            {/* Title */}
            <div className="px-4 pt-4 pb-2">
                <h2 className="text-lg font-bold text-gray-800">
                    Quick Property View
                </h2>
                <p className="text-sm text-gray-500">
                    Access your properties quickly on mobile.
                </p>
            </div>

            {/* Property Slider */}
            <LandlordPropertyMarqueeMobile
                landlordId={user?.landlord_id}
            />
        </div>
    );

}
