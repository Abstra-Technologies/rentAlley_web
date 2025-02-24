"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiBadgeCheck } from "react-icons/hi";
import { FaSearch, FaChevronDown, FaMapMarkerAlt, FaSpinner } from "react-icons/fa";

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
    { label: "₱1,000 - ₱15,000", min: 1000, max: 15000 },
    { label: "₱15,000 - ₱20,000", min: 15000, max: 20000 },
    { label: "Greater than ₱20,000", min: 20000, max: "" },
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Find Your Perfect Rental
        </h1>
        <p className="text-gray-600">Browse our selection of premium rental properties</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
              <FaSearch className="text-gray-400 mx-3" />
              <input
                type="text"
                placeholder="Search by property name, city, street, or province..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 px-2 outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mr-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Price Range Dropdown */}
          <div className="relative md:w-64">
            <button
              onClick={() => setShowPriceDropdown(!showPriceDropdown)}
              className="border-2 border-gray-200 rounded-lg w-full py-3 px-4 flex justify-between items-center hover:border-blue-500 transition bg-white"
              aria-expanded={showPriceDropdown}
              aria-haspopup="listbox"
            >
              <span className={priceRange ? "font-medium text-gray-800" : "text-gray-500"}>
                {priceRange || "Select Price Range"}
              </span>
              <FaChevronDown
                className={`transition-transform duration-300 ${
                  showPriceDropdown ? "rotate-180" : "rotate-0"
                } text-gray-400`}
              />
            </button>

            {showPriceDropdown && (
              <ul 
                className="absolute w-full border bg-white rounded-lg shadow-lg mt-1 z-20 py-1 max-h-60 overflow-auto"
                role="listbox"
              >
                {priceRanges.map((range) => (
                  <li
                    key={range.label}
                    onClick={() => {
                      setPriceRange(range.label);
                      setShowPriceDropdown(false);
                    }}
                    className={`p-3 hover:bg-blue-50 cursor-pointer ${
                      priceRange === range.label ? "bg-blue-100" : ""
                    }`}
                    role="option"
                    aria-selected={priceRange === range.label}
                  >
                    {range.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Active filters */}
        {(debouncedSearch || priceRange) && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {debouncedSearch && (
              <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Search: {debouncedSearch}
              </span>
            )}
            {priceRange && priceRange !== "All Prices" && (
              <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Price: {priceRange}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <FaSearch className="text-gray-400 text-5xl" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or price range to find more options.
          </p>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="mb-4 text-gray-600">
            Found {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
          </div>
          
          {/* Property Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.property_id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                onClick={() => router.push(`/pages/find-rent/${property.property_id}`)}
              >
                {/* Property Image */}
                <div className="relative">
                  {property.property_photo ? (
                    <div className="relative h-48">
                      <Image
                        src={property.property_photo}
                        alt={property.property_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image Available</span>
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                    {property.rent_payment
                      ? `₱${Math.round(property.rent_payment).toLocaleString()}`
                      : "Price on Request"}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h2 className="text-lg font-semibold flex items-center gap-1 mb-1 text-gray-900">
                    {property.property_name}
                    <HiBadgeCheck className="text-blue-500" />
                  </h2>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <FaMapMarkerAlt className="mr-1 text-gray-400" />
                    <p>{property.city}, {property.province}</p>
                  </div>
                  
                  <button className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 font-medium transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
