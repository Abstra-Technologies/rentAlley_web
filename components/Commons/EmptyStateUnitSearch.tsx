"use client";

import {
  MagnifyingGlassIcon,
  HomeIcon,
  ArrowPathIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";

interface Props {
  searchQuery: string;
  onClearSearch: () => void;
}

export default function EmptyState({ searchQuery, onClearSearch }: Props) {
  const isSearchEmpty = searchQuery.length > 0;

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-6 sm:px-8">
        {/* Icon Container */}
        <div className="relative mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl flex items-center justify-center shadow-inner border border-gray-100">
            {isSearchEmpty ? (
              <MagnifyingGlassIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            ) : (
              <InboxIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-base font-bold">0</span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center max-w-md mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            {isSearchEmpty ? "No Matching Units" : "No Active Leases"}
          </h3>

          <p className="text-gray-600 leading-relaxed text-sm">
            {isSearchEmpty
              ? "We couldn't find any properties matching your search criteria. Try different keywords or clear your search to view all available units."
              : "You currently have no active rental agreements. Browse available properties or check your invitations to begin your rental journey."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {isSearchEmpty ? (
            <>
              <button
                onClick={onClearSearch}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-md transition-all text-sm"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Clear Search & View All
              </button>
              <button
                onClick={onClearSearch}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-sm"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Modify Search
              </button>
            </>
          ) : (
            <button
              onClick={onClearSearch}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-md transition-all text-sm"
            >
              <HomeIcon className="w-5 h-5" />
              Explore Properties
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-8 border-t border-gray-100 w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
            <span>
              Need assistance? Check your email for invitations or contact
              support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
