import { AMENITIES_LIST } from "@/constant/amenities";
import { CheckCircle } from "lucide-react";

const AmenitiesSelector = ({ selectedAmenities, onAmenityChange }) => {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {AMENITIES_LIST.map(({ name, icon }) => {
          const isSelected = selectedAmenities.includes(name);

          return (
            <button
              key={name}
              type="button"
              onClick={() => onAmenityChange(name)}
              className={`relative p-3 sm:p-4 rounded-xl transition-all ${
                isSelected
                  ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                  : "bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              {/* CHECKMARK (top-right when selected) */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}

              {/* ICON */}
              <span className="text-2xl sm:text-3xl block mb-1">{icon}</span>

              {/* LABEL */}
              <p className="text-xs sm:text-sm font-semibold">{name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AmenitiesSelector;
