"use client";

import { AMENITIES_LIST_UNIT } from "../../../constant/unitAmenities";
import { CheckCircle } from "lucide-react";

const AmenitiesSelector = ({
                               selectedAmenities = [],
                               onAmenityChange,
                           }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {AMENITIES_LIST_UNIT.map(({ name, icon }) => {
                const isSelected =
                    selectedAmenities.includes(name);

                return (
                    <button
                        type="button"
                        key={name}
                        onClick={() => onAmenityChange(name)}
                        className={`group relative w-full rounded-2xl p-4 transition-all duration-300 ease-in-out
              
              ${
                            isSelected
                                ? "bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg scale-[1.02]"
                                : "bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
                        }
            `}
                    >
                        {/* CHECKMARK */}
                        {isSelected && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle className="w-5 h-5 text-white drop-shadow-sm" />
                            </div>
                        )}

                        {/* CONTENT */}
                        <div className="flex flex-col items-center text-center space-y-2">

                            {/* ICON CONTAINER */}
                            <div
                                className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl transition-all
                  ${
                                    isSelected
                                        ? "bg-white/20"
                                        : "bg-gray-100 group-hover:bg-blue-100"
                                }
                `}
                            >
                                {icon}
                            </div>

                            {/* LABEL */}
                            <p
                                className={`text-xs sm:text-sm font-semibold leading-tight
                  ${
                                    isSelected
                                        ? "text-white"
                                        : "text-gray-700 group-hover:text-blue-600"
                                }
                `}
                            >
                                {name}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default AmenitiesSelector;
