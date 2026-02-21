import { AMENITIES_LIST } from "@/constant/amenities";
import { Check } from "lucide-react";

const AmenitiesSelector = ({ selectedAmenities = [], onAmenityChange }) => {
    return (
        <div className="grid grid-cols-2 gap-2">
            {AMENITIES_LIST.map(({ name, icon }) => {
                const isSelected = selectedAmenities.includes(name);

                return (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onAmenityChange(name)}
                        className={`
              flex items-center gap-2
              px-3 py-2
              rounded-lg
              border
              text-xs font-medium
              transition-all duration-150
              active:scale-95
              ${
                            isSelected
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                        }
            `}
                    >
                        {/* ICON */}
                        <span className="text-base">
              {icon}
            </span>

                        {/* LABEL */}
                        <span className="truncate">
              {name}
            </span>

                        {/* CHECK ICON */}
                        {isSelected && (
                            <Check className="w-3.5 h-3.5 ml-auto" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default AmenitiesSelector;