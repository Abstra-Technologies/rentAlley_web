"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
  const isFiltered = searchQuery.length > 0;
  const hasResults = filteredCount > 0;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <MagnifyingGlassIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Search Properties
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Find units by name, property, or location
              </p>
            </div>
          </div>

          {/* Results Counter */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Showing
            </span>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
                {filteredCount}
              </span>
              <span className="text-gray-400 text-sm mx-1">/</span>
              <span className="text-gray-600 text-sm font-semibold tabular-nums">
                {totalUnits}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Section */}
      <div className="p-6">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>

          <input
            type="text"
            placeholder="Search by unit name, property name, city, or province..."
            className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl
                     focus:ring-0 focus:border-blue-500 focus:outline-none
                     text-base bg-gray-50/50 focus:bg-white transition-all duration-200
                     placeholder:text-gray-400 font-medium text-gray-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
            aria-label="Search units"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2
                       text-gray-400 hover:text-gray-700 transition-all duration-200
                       p-2 hover:bg-gray-100 rounded-lg group"
              aria-label="Clear search"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mobile Results Counter */}
        <div className="sm:hidden flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Results
          </span>
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
              {filteredCount}
            </span>
            <span className="text-gray-400 text-sm mx-1.5">/</span>
            <span className="text-gray-600 text-sm font-semibold tabular-nums">
              {totalUnits}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {isFiltered && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    hasResults ? "bg-emerald-500" : "bg-amber-500"
                  } animate-pulse`}
                ></div>
                <span className="text-sm font-semibold text-gray-700">
                  {hasResults
                    ? `Found ${filteredCount} ${
                        filteredCount === 1 ? "unit" : "units"
                      } matching your search`
                    : "No units found matching your criteria"}
                </span>
              </div>

              <button
                onClick={() => setSearchQuery("")}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 
                         flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-50 rounded-lg
                         transition-all duration-200"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear search
              </button>
            </div>

            {/* Active Search Tag */}
            <div className="mt-3">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md">
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span className="max-w-xs truncate">"{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:bg-white/20 rounded p-1 transition-colors"
                  aria-label="Remove search"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
