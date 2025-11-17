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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch results
  useEffect(() => {
    if (!query.trim() || !user?.landlord_id) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/landlord/properties/searchLease?q=${encodeURIComponent(
            query
          )}&landlord_id=${user.landlord_id}`
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

    const delay = setTimeout(fetchResults, 350);
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
      className="
        relative w-full max-w-lg 
        mx-auto 
        px-2 sm:px-0
        transition-all duration-300
      "
    >
      {/* Search Card */}
      <div
        className="
          w-full 
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-xl 
          shadow-sm 
          px-3 py-3 sm:px-5 sm:py-5
          flex flex-col items-center
          transition-all duration-300
        "
      >
        {/* Input */}
        <div className="relative w-full">
          <MagnifyingGlassIcon
            className="
              absolute left-3 top-2.5 
              sm:top-3 
              h-4 w-4 sm:h-5 sm:w-5
              text-gray-400
            "
          />

          <input
            type="text"
            placeholder="Search tenants, lease, property..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full
              pl-10 pr-4 
              py-2.5 sm:py-3
              text-sm sm:text-base
              rounded-lg
              border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-900
              text-gray-700 dark:text-gray-100
              placeholder:text-gray-400
              focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40
              outline-none
              shadow-inner
              transition
            "
          />
        </div>

        {/* Helper Text */}
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 text-center">
          Search by tenant name, unit, or property.
        </p>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="
            absolute left-0 right-0 
            top-full mt-2 
            bg-white dark:bg-gray-900
            rounded-xl 
            border border-gray-200 dark:border-gray-700
            shadow-xl 
            max-h-60 overflow-y-auto
            z-50
          "
        >
          {loading ? (
            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.agreement_id}
                onClick={() => handleSelect(item.property_id, item.agreement_id)}
                className="
                  w-full text-left
                  px-4 py-2.5 sm:px-5 sm:py-3
                  bg-white dark:bg-gray-900
                  hover:bg-blue-50 dark:hover:bg-gray-800
                  transition
                  border-b border-gray-100 dark:border-gray-800 last:border-0
                "
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
            <div className="py-4 sm:py-5 text-center text-sm text-gray-500 dark:text-gray-400">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
