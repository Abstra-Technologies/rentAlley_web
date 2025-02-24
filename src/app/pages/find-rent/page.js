"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiBadgeCheck } from "react-icons/hi";
import { FaSearch, FaChevronDown } from "react-icons/fa";

export default function PropertySearch() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const router = useRouter();
  const [priceRange, setPriceRange] = useState(""); // Price range filter
  const [showPriceDropdown, setShowPriceDropdown] = useState(false); // Toggle price dropdown

  // Define price range options
  const priceRanges = [
    { label: "All Prices", min: "", max: "" },
    { label: "₱1,000 - ₱5,000", min: 1000, max: 5000 },
    { label: "₱6,000 - ₱10,000", min: 6000, max: 10000 },
    { label: "Greater than ₱10,000", min: 11000, max: "" },
  ];

  // ✅ Debounce Effect (Only updates `debouncedSearch`)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 1000);

    return () => {
      clearTimeout(handler); // Clear timeout if user keeps typing
    };
  }, [searchQuery]);

  // ✅ Fetch properties based on debounced search & price range
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (debouncedSearch) params.append("searchQuery", debouncedSearch);
        if (priceRange) {
          const selectedRange = priceRanges.find(
            (range) => range.label === priceRange
          );
          if (selectedRange) {
            if (selectedRange.min) params.append("minPrice", selectedRange.min);
            if (selectedRange.max) params.append("maxPrice", selectedRange.max);
          }
        }

        const res = await fetch(
          `/api/properties/findRent?${params.toString()}`
        );
        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();
        setProperties(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [debouncedSearch, priceRange]); // 🔹 Trigger only when `debouncedSearch` or `priceRange` changes

  if (loading)
    return <p className="text-center text-lg">Loading properties...</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Find Your Rental Property
      </h1>

      {/* 🔍 Search Bar & Price Filter */}
      <div className="flex flex-col md:flex-row gap-2">
        {/* Search Input */}
        <div className="flex items-center border rounded-lg p-2 flex-1 shadow-md bg-white">
          <FaSearch className="text-gray-400 mx-2" />
          <input
            type="text"
            placeholder="Search by property name, city, street, or province..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent p-2"
          />
        </div>

        {/* Price Range Dropdown */}
        <div className="relative w-full md:w-48">
          <button
            onClick={() => setShowPriceDropdown(!showPriceDropdown)}
            className="border p-2 rounded w-full flex justify-between items-center bg-gray-100"
          >
            {priceRange ? priceRange : "Select Price Range"}
            <FaChevronDown
              className={`transition-transform duration-300 ${
                showPriceDropdown ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {showPriceDropdown && (
            <ul className="absolute w-full border bg-white rounded shadow-md mt-1 z-10">
              {priceRanges.map((range) => (
                <li
                  key={range.label}
                  onClick={() => {
                    setPriceRange(range.label);
                    setShowPriceDropdown(false);
                  }}
                  className="p-2 hover:bg-gray-200 cursor-pointer"
                >
                  {range.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Display Properties */}
      {properties.length === 0 ? (
        <p className="mt-4 text-center">No properties found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {properties.map((property) => (
            <div
              key={property.property_id}
              className="border rounded-lg p-4 shadow-md cursor-pointer hover:shadow-lg transition"
              onClick={() =>
                router.push(`/pages/find-rent/${property.property_id}`)
              }
            >
              {/* 🔓 Property Image */}
              {property.property_photo ? (
                <Image
                  src={property.property_photo}
                  alt={property.property_name}
                  height={100}
                  width={100}
                  className="w-full h-40 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-40 bg-gray-300 flex items-center justify-center rounded-lg">
                  No Image
                </div>
              )}

              {/* ✅ Property Details */}
              <h2 className="text-lg font-semibold mt-2 flex items-center gap-1">
                {property.property_name}
                <HiBadgeCheck />
              </h2>
              <p className="text-gray-600">
                {property.city}, {property.province}
              </p>
              <p className="text-sm font-semibold text-gray-700">
                {property.rent_payment
                  ? `₱${Math.round(property.rent_payment).toLocaleString()}`
                  : "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
