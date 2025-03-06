"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Building, MapPin, Grid3x3 } from "lucide-react";

// Mock data - replace with actual data fetching
const properties = [
  {
    id: "1",
    name: "Sunrise Apartments",
    location: "Manila",
    numberOfUnits: 5,
    occupancyRate: 80,
    totalRevenue: 75000,
  },
  {
    id: "2",
    name: "Horizon Residences",
    location: "Quezon City",
    numberOfUnits: 3,
    occupancyRate: 66,
    totalRevenue: 45000,
  },
  {
    id: "3",
    name: "Seaside Condos",
    location: "Pasay City",
    numberOfUnits: 2,
    occupancyRate: 50,
    totalRevenue: 30000,
  },
];

const PropertyListPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter properties based on search and status
  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterStatus === "all" || property.status === filterStatus)
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Building className="mr-3 text-blue-500" size={32} />
          My Properties
        </h1>

        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-3 text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-10 bg-gray-100 rounded-lg">
          <p className="text-xl text-gray-600">No properties found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className={`
                bg-white shadow-md rounded-lg overflow-hidden 
                hover:shadow-xl transition-all duration-300 
                border-l-4 
                ${
                  property.status === "active"
                    ? "border-green-500"
                    : "border-yellow-500"
                }
              `}
            >
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {property.name}
                </h2>
                <div className="space-y-3 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="mr-2 text-blue-500" size={20} />
                    <span className="font-medium">{property.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Grid3x3 className="mr-2 text-blue-500" size={20} />
                    <span className="font-medium">
                      {property.numberOfUnits} Units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">Occupancy:</span>{" "}
                      {property.occupancyRate}%
                    </div>
                    <div>
                      <span className="font-medium">Revenue:</span> ₱
                      {property.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <Link href={`/pages/landlord/billing/viewUnitBills`}>
                  <button
                    className="
                      w-full mt-4 
                      bg-blue-500 text-white 
                      py-2 rounded-md 
                      hover:bg-blue-600 
                      transition-colors 
                      flex items-center justify-center
                    "
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="mr-2"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    View Units
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyListPage;
