"use client";
import React, { useState } from "react";
import Link from "next/link";
import useAuth from "../../../../../hooks/useSession";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import { useEffect } from "react";
import axios from "axios";
import LoadingScreen from "../../../../components/loadingScreen";

const PropertyListPage = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/landlord/billing/getPropertyUnits?landlordId=${user?.landlord_id}`
        );
        if (Array.isArray(response.data)) {
          setProperties(response.data);
        } else {
          console.error("Invalid API response:", response.data);
          setProperties([]); // Fallback to empty array
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProperties([]); // Fallback to empty array in case of an error
      } finally {
        setLoading(false);
      }
    };

    if (user?.landlord_id) {
      fetchProperties();
    }
  }, [user?.landlord_id]);
  // Filter properties
  const filteredProperties = properties.filter(
    (property) =>
      property.property_name &&
      property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterStatus === "all" || property.status === filterStatus)
  );

  if (loading) {
    return <LoadingScreen />; // Show loading screen while fetching data
  }

  return (
    <LandlordLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Properties</h1>

          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded-md"
          />
        </div>

        {filteredProperties.length === 0 ? (
          <p className="text-center text-gray-600">No properties found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property.property_id}
                className="bg-white p-5 rounded-lg shadow-md"
              >
                <h2 className="text-xl font-bold">{property.property_name}</h2>
                <p className="text-gray-600">
                  {property.city},{" "}
                  {property.province
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </p>
                <p className="text-gray-600">
                  Total Units: {property.units.length}
                </p>

                <Link
                  href={`/pages/landlord/billing/viewUnit/${property.property_id}`}
                >
                  <button className="bg-blue-500 text-white px-4 py-2 mt-3 rounded-md hover:bg-blue-600">
                    View Units
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </LandlordLayout>
  );
};

export default PropertyListPage;
