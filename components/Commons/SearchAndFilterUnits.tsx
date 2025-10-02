"use client";

import { FaSearch, FaTimes } from "react-icons/fa";
import { sanitizeInput } from "@/utils/formatter/formatters";

interface Props {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    totalUnits: number;
    filteredCount: number;
}

export default function SearchAndFilterUnits({
                                            searchQuery,
                                            setSearchQuery,
                                            totalUnits,
                                            filteredCount,
                                        }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="flex-1 relative w-full">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search your units, properties, or locations..."
                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl
                       focus:ring-0 focus:border-emerald-500 focus:outline-none
                       text-sm bg-gray-50 focus:bg-white transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                        aria-label="Search units"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2
                         text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Clear search"
                        >
                            <FaTimes className="text-sm" />
                        </button>
                    )}
                </div>

                {/* Counter */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 rounded-full">
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              {filteredCount}
            </span>
                        <span className="text-gray-600 ml-1">of {totalUnits} units</span>
                    </div>
                </div>
            </div>

            {/* Active Filter Tag */}
            {searchQuery && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                        <FaSearch className="mr-1 text-xs" />"{searchQuery}"
                        <button
                            onClick={() => setSearchQuery("")}
                            className="ml-2 text-emerald-600 hover:text-emerald-800 transition-colors"
                            aria-label="Remove search filter"
                        >
                            <FaTimes className="text-xs" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
