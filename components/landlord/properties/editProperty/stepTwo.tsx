import AmenitiesSelector from "@/components/landlord/createProperty/amenities-selector";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";

export function StepTwoEdit() {
    // @ts-ignore
    const { property, setProperty } = useEditPropertyStore();

    const handleAmenityChange = (amenity: string) => {
        const currentAmenities = property.amenities || [];
        const amenityIndex = currentAmenities.indexOf(amenity);
        let newAmenities;

        if (amenityIndex > -1) {
            newAmenities = [
                ...currentAmenities.slice(0, amenityIndex),
                ...currentAmenities.slice(amenityIndex + 1),
            ];
        } else {
            newAmenities = [...currentAmenities, amenity];
        }

        setProperty({ amenities: newAmenities });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 sm:p-6 rounded-xl">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    Update your property's amenities
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                    Select the amenities available in your place.
                </p>
            </div>

            {/* Amenities Selector */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
                <AmenitiesSelector
                    selectedAmenities={property.amenities || []}
                    onAmenityChange={handleAmenityChange}
                />
            </div>
        </div>
    );

}
