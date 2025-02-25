"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BiCheckCircle } from "react-icons/bi";

export default function PropertySearch() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/properties/findRent");
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
  }, []);

  if (loading)
    return <p className="text-center text-lg">Loading properties...</p>;

  const filteredProperties = properties.filter((property) =>
    property.property_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Verified Properties</h1>

      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Search properties..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {filteredProperties.length === 0 ? (
        <p>No verified properties found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.property_id}
              className="border rounded-lg p-4 shadow-md cursor-pointer hover:shadow-lg transition"
              onClick={() =>
                router.push(`/pages/find-rent/${property.property_id}`)
              } // Navigate to property details
            >
              {/* 🔓 Property Image */}
              {property.property_photo ? (
                <Image
                  src={property.property_photo}
                  alt={property.property_name}
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-[300px] h-[200px] bg-gray-300 flex items-center justify-center">
                  No Property Image
                </div>
              )}

              {/* ✅ Property Name with Verification Check */}
              <h2 className="text-lg font-semibold mt-2 flex items-center gap-1">
                {property.property_name}{" "}
                <BiCheckCircle className="text-green-500" />
              </h2>

              <p className="text-gray-600">
                {property.city}, {property.province}
              </p>
              <p className="text-sm text-gray-500">
                {property.property_type.charAt(0).toUpperCase() +
                  property.property_type.slice(1)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
