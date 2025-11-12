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
            className="relative w-full max-w-2xl mx-auto flex justify-center px-3 sm:px-0 transition-all duration-300"
        >
            {/* 🌟 Search Card */}
            <div
                className="w-full bg-gradient-to-br from-white to-gray-50 border border-gray-100/70
      dark:from-gray-900 dark:to-gray-800 dark:border-gray-700
      rounded-2xl shadow-sm sm:shadow-md p-4 sm:p-6 flex flex-col items-center justify-center
      transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
            >
                {/* 🔍 Input */}
                <div className="relative w-full group">
                    <MagnifyingGlassIcon
                        className="absolute left-3 sm:left-4 top-3 h-5 w-5
          text-gray-400 group-focus-within:text-blue-600 transition-colors"
                    />

                    <input
                        type="text"
                        placeholder="Search tenants by name, email, or property..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2.5 sm:py-3
          text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600
          focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40
          bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm
          text-gray-800 dark:text-gray-100 placeholder:text-gray-400
          shadow-inner outline-none transition-all duration-150"
                    />
                </div>

                {/* 📝 Helper Text */}
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-3 text-center leading-tight">
                    Search across your current tenants via email, property, or unit name.
                </p>
            </div>

            {/* 🧾 Dropdown */}
            {showDropdown && (
                <div
                    className="absolute top-full mt-2 sm:mt-3 w-full
        bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700
        shadow-xl overflow-hidden max-h-64 sm:max-h-72 overflow-y-auto z-50
        animate-fade-in"
                >
                    {loading ? (
                        <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Loading results...
                        </div>
                    ) : results.length > 0 ? (
                        results.map((item) => (
                            <button
                                key={item.agreement_id}
                                onClick={() => handleSelect(item.property_id, item.agreement_id)}
                                className="w-full text-left px-4 sm:px-5 py-3 flex flex-col gap-0.5
              bg-white dark:bg-gray-900 hover:bg-gradient-to-r
              hover:from-blue-50 hover:to-emerald-50 dark:hover:from-gray-800 dark:hover:to-gray-700
              transition-all duration-150 border-b border-gray-100 dark:border-gray-800 last:border-0"
                            >
                                <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 truncate">
                                    {item.firstName} {item.lastName}
                                </p>
                                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {item.property_name} — {item.unit_name}
                                </p>
                            </button>
                        ))
                    ) : (
                        <div className="py-4 sm:py-5 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No matches found
                        </div>
                    )}
                </div>
            )}
        </div>
    );

}

