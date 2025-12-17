import { AMENITIES_LIST } from "@/constant/amenities";

const AmenitiesSelector = ({ selectedAmenities, onAmenityChange }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Select Amenities</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {AMENITIES_LIST.map(({ name, icon }) => {
                    const isSelected = selectedAmenities.includes(name);

                    return (
                        <button
                            key={name}
                            type="button"
                            onClick={() => onAmenityChange(name)}
                            className={`
                flex flex-col items-center justify-center
                min-h-[96px] px-3 py-3 rounded-xl border text-sm
                transition-all duration-200
                ${isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                : "bg-white border-gray-300 hover:bg-blue-50"}
              `}
                        >
                            {/* ICON WRAPPER (fixes alignment) */}
                            <div className="flex items-center justify-center w-8 h-8 mb-1">
                                <span className="text-xl leading-none">{icon}</span>
                            </div>

                            {/* LABEL */}
                            <span className="text-center leading-tight">{name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AmenitiesSelector;
