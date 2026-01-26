"use client";

import LandlordPropertyMarqueeMobile from "@/components/landlord/main_dashboard/LandlordPropertyMarqueeMobile";

interface Props {
    landlordId: string;
}

export default function MobileLandlordDashboard({ landlordId }: Props) {
    // Convert string to number for the property component
    const landlordIdNumber = parseInt(landlordId, 10);

    return (
        <div className="block md:hidden w-full space-y-6 pb-6">
            {/* Property Carousel */}
            <LandlordPropertyMarqueeMobile landlordId={landlordIdNumber} />
        </div>
    );
}