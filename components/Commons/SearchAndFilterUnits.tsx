"use client";

import { FaSearch, FaTimes } from "react-icons/fa";

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalUnits: number;
  filteredCount: number;
}

const sanitizeInput = (input: string) => {
  return input.replace(/[<>]/g, "").slice(0, 100);
};

export default function SearchAndFilterUnits({
  searchQuery,
  setSearchQuery,
  totalUnits,
  filteredCount,
}: Props) {
  return (
    <div className="w-full rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 bg-white hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Search Units
          </label>
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by unit name, property, or location..."
              className="w-full pl-11 pr-11 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl
                       focus:ring-0 focus:border-emerald-500 focus:outline-none
                       text-sm sm:text-base bg-gray-50 focus:bg-white transition-all duration-200
                       placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
              aria-label="Search units"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2
                       text-gray-400 hover:text-gray-600 transition-colors duration-200
                       p-1 hover:bg-gray-200 rounded-lg"
                aria-label="Clear search"
              >
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 font-medium">Results:</span>
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-3 sm:px-4 py-2 rounded-full border border-gray-100 flex items-center gap-1">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                {filteredCount}
              </span>
              <span className="text-gray-600 text-xs sm:text-sm">
                of {totalUnits}
              </span>
            </div>
          </div>

          {filteredCount === 0 && searchQuery && (
            <div className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-lg">
              No units match your search
            </div>
          )}
        </div>

        {searchQuery && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-emerald-200">
              <FaSearch className="text-xs opacity-70" />
              <span className="truncate">"{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery("")}
                className="text-emerald-600 hover:text-emerald-800 hover:bg-white hover:bg-opacity-50 rounded transition-colors p-0.5"
                aria-label="Remove search filter"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
