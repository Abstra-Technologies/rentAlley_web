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
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Search Section */}
      <div className="p-4 sm:p-5">
        <div className="relative group">
          {/* Left Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by property, unit, city, or province..."
            className="
              w-full
              pl-12 pr-12
              py-3 sm:py-3.5
              rounded-xl
              border-2 border-gray-200
              bg-gray-50 focus:bg-white
              focus:ring-0 focus:border-blue-500
              transition-all
              text-sm sm:text-base
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
                absolute right-4 top-1/2 -translate-y-1/2
                p-2
                rounded-lg
                hover:bg-gray-100
                text-gray-400 hover:text-gray-700
                transition-all
              "
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status Messages */}
        {isFiltered && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`
                    w-2 h-2 rounded-full
                    ${
                      hasResults
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-amber-500"
                    }
                  `}
                ></span>

                <span className="text-sm text-gray-700 font-semibold">
                  {hasResults
                    ? `Found ${filteredCount} ${
                        filteredCount === 1 ? "unit" : "units"
                      }`
                    : "No units found"}
                </span>
              </div>

              {/* Clear button */}
              <button
                onClick={() => setSearchQuery("")}
                className="
                  flex items-center gap-1.5
                  text-sm font-semibold
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
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm text-sm font-semibold">
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span className="max-w-[200px] truncate">"{searchQuery}"</span>
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
