"use client";

import { FaSearch } from "react-icons/fa";
import { HomeIcon } from "@heroicons/react/24/outline";

interface Props {
    searchQuery: string;
    onClearSearch: () => void;
}

export default function EmptyState({ searchQuery, onClearSearch }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
            {searchQuery ? (
                    <FaSearch className="w-8 h-8 text-emerald-600" />
                ) : (
                    <HomeIcon className="w-8 h-8 text-emerald-600" />
                )}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {searchQuery ? "No units found" : "No active leases"}
        </h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
    {searchQuery
        ? "Try adjusting your search terms or clear the search to see all units."
        : "You currently have no active leases. Check your invitations or browse available properties."}
    </p>
    {searchQuery && (
        <button
            onClick={onClearSearch}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
            Clear Search
    </button>
    )}
    </div>
);
}
