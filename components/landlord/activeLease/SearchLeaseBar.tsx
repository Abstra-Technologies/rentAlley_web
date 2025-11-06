"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function SearchLeaseBar() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim() || !user?.landlord_id) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/landlord/properties/searchLease?q=${encodeURIComponent(query)}&landlord_id=${user.landlord_id}`
                );
                const data = await res.json();
                setResults(data);
                setShowDropdown(true);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        const delay = setTimeout(fetchResults, 400); // debounce typing
        return () => clearTimeout(delay);
    }, [query, user?.landlord_id]);

    const handleSelect = (propertyId: number, agreementId: number) => {
        setShowDropdown(false);
        setQuery("");
        router.push(
            `/pages/landlord/properties/${propertyId}/activeLease/leaseDetails/${agreementId}`
        );
    };


    return (
        <div
            ref={dropdownRef}
            className="relative w-full max-w-2xl mx-auto flex justify-center transition-all duration-200 px-2 sm:px-0"
        >
            {/* 🌟 Search Card Container */}
            <div
                className="w-full bg-white border border-gray-200 rounded-2xl shadow-md
                 p-3 sm:p-5 flex flex-col items-center justify-center
                 transition-all duration-200 hover:shadow-lg"
            >
                {/* 🔍 Input Field */}
                <div className="relative w-full group">
                    <MagnifyingGlassIcon
                        className="absolute left-3 sm:left-4 top-3 h-4 sm:h-5 w-4 sm:w-5
                     text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    />

                    <input
                        type="text"
                        placeholder="Search tenants..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5
                     text-sm sm:text-base rounded-lg border border-gray-300
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-400
                     bg-gray-50 hover:bg-white shadow-sm outline-none
                     transition-all duration-150"
                    />
                </div>

                {/* 📝 Helper Text */}
                <p className="text-[11px] sm:text-xs text-gray-500 mt-2 text-center leading-tight">
                    Search across your current tenants via email, property, or unit name.
                </p>
            </div>

            {/* 🧾 Dropdown Results */}
            {showDropdown && results.length > 0 && (
                <div
                    className="absolute top-full mt-2 sm:mt-3 w-full
               bg-white rounded-xl shadow-xl border border-gray-200
               overflow-hidden max-h-60 sm:max-h-72 overflow-y-auto z-50"
                >
                    {results.map((item) => (
                        <button
                            key={item.agreement_id}
                            onClick={() => handleSelect(item.property_id, item.agreement_id)}
                            className="w-full text-left px-4 sm:px-5 py-2 sm:py-2.5
                   flex flex-col hover:bg-gradient-to-r
                   hover:from-blue-50 hover:to-emerald-50
                   transition-colors border-b border-gray-100 last:border-0"
                        >
                            <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                                {item.firstName} {item.lastName}
                            </p>
                            <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                                {item.property_name} — {item.unit_name}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {/* 🚫 No Results */}
            {showDropdown && !loading && results.length === 0 && (
                <div
                    className="absolute top-full mt-2 sm:mt-3 w-full bg-white
                   rounded-xl shadow-lg border border-gray-200
                   px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm
                   text-gray-500 text-center z-50"
                >
                    No matches found
                </div>
            )}
        </div>
    );
}

