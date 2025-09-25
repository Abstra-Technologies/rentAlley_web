import AmenitiesSelector from "../amenities-selector";
import usePropertyStore from "../../zustand/property/usePropertyStore";

export function StepTwo() {
  const { property, setProperty } = usePropertyStore();

  const handleAmenityChange = (amenity) => {
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Tell renters what your place offers
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
          Select the amenities available in your place to attract the right
          tenants.
        </p>
      </div>

      {/* Amenities Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Available Amenities
              </h3>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <AmenitiesSelector
                selectedAmenities={property.amenities || []}
                onAmenityChange={handleAmenityChange}
              />
            </div>

            {/* Selected Amenities Summary */}
            {(property.amenities || []).length > 0 && (
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Selected Amenities ({(property.amenities || []).length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(property.amenities || []).map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-emerald-100 text-blue-800 border border-blue-200"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Pro tip:</span> Properties
                    with more amenities tend to attract more interest and can
                    command higher rental rates. Don't forget to include basic
                    amenities like parking, Wi-Fi, and security features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
