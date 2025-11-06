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
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-6 sm:px-8">
        {/* Icon Container */}
        <div className="relative mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 rounded-2xl flex items-center justify-center shadow-inner">
            {isSearchEmpty ? (
              <MagnifyingGlassIcon className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400" />
            ) : (
              <InboxIcon className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">0</span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center max-w-md mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {isSearchEmpty ? "No Matching Units" : "No Active Leases"}
          </h3>

          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
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
                className="flex items-center justify-center gap-2.5 px-8 py-3.5 
                         bg-gradient-to-r from-blue-500 to-emerald-500 text-white 
                         font-bold rounded-xl hover:shadow-xl transition-all duration-300 
                         transform hover:scale-[1.02] active:scale-[0.98] text-base"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Clear Search & View All
              </button>
              <button
                onClick={onClearSearch}
                className="flex items-center justify-center gap-2.5 px-8 py-3.5 
                         bg-white border-2 border-gray-200 text-gray-700 
                         font-bold rounded-xl hover:border-gray-300 hover:shadow-md 
                         transition-all duration-300 transform hover:scale-[1.02] 
                         active:scale-[0.98] text-base"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Modify Search
              </button>
            </>
          ) : (
            <button
              onClick={onClearSearch}
              className="flex items-center justify-center gap-2.5 px-8 py-3.5 
                       bg-gradient-to-r from-blue-500 to-emerald-500 text-white 
                       font-bold rounded-xl hover:shadow-xl transition-all duration-300 
                       transform hover:scale-[1.02] active:scale-[0.98] text-base"
            >
              <HomeIcon className="w-5 h-5" />
              Explore Properties
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-8 border-t border-gray-100 w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
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
