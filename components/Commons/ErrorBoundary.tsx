"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
  error: string;
  onRetry: () => void;
  title?: string;
}

export default function ErrorBoundary({ error, onRetry, title }: Props) {
  return (
      <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 border border-rose-200 p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <div className="mb-6 relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600 animate-pulse" />
            </div>
            <div className="absolute inset-0 bg-rose-200 rounded-full opacity-20 animate-ping"></div>
          </div>

          {/* ✅ Dynamic Title */}
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 text-center">
            {title || "Something went wrong"}
          </h3>

          {/* ✅ Dynamic Error Message */}
          <p className="text-gray-700 text-center mb-6 max-w-lg leading-relaxed
               text-base sm:text-lg md:text-xl font-medium">
            {error || "An unexpected error occurred. Please try again."}
          </p>


          <button
              onClick={onRetry}
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            Try Again
          </button>

          <p className="text-xs sm:text-sm text-gray-500 mt-4 text-center">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
  );
}
