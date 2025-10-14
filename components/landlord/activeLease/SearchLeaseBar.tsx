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
                console.log(data);
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

    const handleSelect = (agreementId: number) => {
        setShowDropdown(false);
        setQuery("");
        router.push(`/pages/lease/${agreementId}`);
    };

    return (
        <div className="relative max-w-md w-full mx-auto" ref={dropdownRef}>
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search tenant email, property, or unit..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                />
            </div>

            {showDropdown && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-72 overflow-y-auto">
                    {results.map((item) => (
                        <button
                            key={item.agreement_id}
                            onClick={() => handleSelect(item.agreement_id)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex flex-col border-b border-gray-100 last:border-0"
                        >
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {item.firstName} {item.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {item.property_name} — {item.unit_name}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {showDropdown && !loading && results.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-sm text-gray-500 text-center">
                    No matches found
                </div>
            )}
        </div>
    );
}

