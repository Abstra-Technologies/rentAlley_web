"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalUnits: number;
  filteredCount: number;
}

const sanitizeInput = (input: string) =>
  input.replace(/[<>]/g, "").slice(0, 100);

export default function SearchAndFilterUnits({
  searchQuery,
  setSearchQuery,
  totalUnits,
  filteredCount,
}: Props) {
  const isFiltered = searchQuery.length > 0;
  const hasResults = filteredCount > 0;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Search Section */}
      <div className="p-4 sm:p-6">

        <div className="relative group">

          {/* Left Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search units, properties, cities..."
            className="
              w-full
              pl-10 pr-10
              py-2.5 sm:py-3
              rounded-xl
              border border-gray-300
              bg-gray-50 focus:bg-white
              focus:ring-0 focus:border-blue-500
              transition-all
              
              text-[13px] sm:text-base     /* font-size responsive */
              font-medium text-gray-900
              placeholder:text-gray-400
            "
            value={searchQuery}
            onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
            aria-label="Search units"
          />

          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                p-1.5 sm:p-2 
                rounded-lg
                hover:bg-gray-100 
                text-gray-400 hover:text-gray-700
                transition-all
              "
            >
              <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Status Messages */}
        {isFiltered && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-3">

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`
                    w-2 h-2 rounded-full animate-pulse
                    ${hasResults ? "bg-emerald-500" : "bg-amber-500"}
                  `}
                ></span>

                <span className="text-[13px] sm:text-sm text-gray-700 font-semibold">
                  {hasResults
                    ? `Found ${filteredCount} ${filteredCount === 1 ? "unit" : "units"}`
                    : "No units found"}
                </span>
              </div>

              {/* Clear button */}
              <button
                onClick={() => setSearchQuery("")}
                className="
                  flex items-center gap-1.5
                  text-[13px] sm:text-sm font-semibold 
                  text-blue-600 hover:text-blue-700
                  px-3 py-1.5 rounded-lg
                  hover:bg-blue-50
                  transition-all
                "
              >
                <XMarkIcon className="w-4 h-4" />
                Clear search
              </button>

            </div>

            {/* Active Search Chip */}
            <div className="mt-3">
              <div
                className="
                  inline-flex items-center gap-2
                  bg-gradient-to-r from-blue-500 to-emerald-500
                  text-white 
                  px-3 py-1.5 
                  rounded-lg shadow-md
                  text-[12px] sm:text-sm font-semibold
                "
              >
                <MagnifyingGlassIcon className="w-4 h-4" />

                <span className="max-w-[200px] truncate">
                  "{searchQuery}"
                </span>

                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Remove search"
                  className="hover:bg-white/20 rounded p-1 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
