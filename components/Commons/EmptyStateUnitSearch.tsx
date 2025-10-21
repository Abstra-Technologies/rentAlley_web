"use client";

import { FaSearch } from "react-icons/fa";
import { HomeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface Props {
  searchQuery: string;
  onClearSearch: () => void;
}

export default function EmptyState({ searchQuery, onClearSearch }: Props) {
  const isSearchEmpty = searchQuery.length > 0;

  return (
    <div className="w-full rounded-2xl border border-gray-100 overflow-hidden bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50">
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
        <div className="mb-6 relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
            {isSearchEmpty ? (
              <FaSearch className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            ) : (
              <HomeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-emerald-200 rounded-full opacity-20 animate-pulse"></div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
          {isSearchEmpty ? "No units found" : "No active leases yet"}
        </h3>

        <p className="text-gray-600 text-center mb-8 max-w-md text-sm sm:text-base leading-relaxed">
          {isSearchEmpty
            ? "We couldn't find any units matching your search. Try adjusting your keywords or filters."
            : "You currently have no active rental agreements. Explore available properties or check your invitations to get started."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {isSearchEmpty && (
            <button
              onClick={onClearSearch}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Clear Search
            </button>
          )}

          {!isSearchEmpty && (
            <button
              onClick={onClearSearch}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <HomeIcon className="w-4 h-4" />
              Browse Properties
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mt-4 text-center">
          Need help? Contact support or check your email for invitations.
        </p>
      </div>
    </div>
  );
}
