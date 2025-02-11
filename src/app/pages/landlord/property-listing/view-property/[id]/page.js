"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import properties from "../../../../../data/properties.json";
import units from "../../../../../data/units.json"; // Adjust the path as needed
import LandlordLayout from "../../../layouts/landlordLayouts";

const ViewPropertyPage = () => {
  const { id } = useParams(); // Get the dynamic ID from the URL
  const router = useRouter();

  // Find the property by ID
  const property = properties.find((property) => property.id === String(id));
  const propertyUnits = units.filter((unit) => unit.propertyId === id);

  // Handle Edit Unit
  const handleEditUnit = (unitId) => {
    // Navigate to the edit page for the specific unit
    router.push(
      `/pages/landlord/property-listing/view-property/${id}/edit-unit/${unitId}`
    );
  };

  if (!property) {
    return <p>Property not found.</p>;
  }

  return (
    <LandlordLayout>
      <h1>
        This page is where the single property details will be and tenant
        request history.
      </h1>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* Property Header */}
        <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
        <p className="text-sm text-gray-600 mb-6">{property.address}</p>

        {/* Add New Unit Button */}
        <button
          className="px-4 py-2 mb-6 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          onClick={() =>
            router.push(
              `/pages/landlord/property-listing/view-property/${id}/create-unit`
            )
          }
        >
          + Add New Unit
        </button>

        {/* Units Section */}
        <div className="grid grid-cols-1 gap-6">
          {propertyUnits.map((unit) => (
            <div
              key={unit.unitId} // Add a unique key prop
              className="p-4 bg-white rounded-lg shadow-md space-y-4 hover:shadow-lg transition-shadow"
            >
              {/* Unit Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">
                  {property.name} - {unit.name}
                </h3>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-md ${
                    unit.status === "Occupied"
                      ? "bg-green-100 text-green-800"
                      : unit.status === "Unoccupied"
                      ? "bg-red-100 text-red-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {unit.status}
                </span>
              </div>

              {/* Unit Details */}
              <p className="text-sm text-gray-600">{unit.description}</p>
              {unit.tenantName ? (
                <p className="text-sm font-medium text-gray-800">
                  Tenant: {unit.tenantName}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Tenant: Unoccupied</p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-4">
                <button
                  className="px-3 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  onClick={() =>
                    alert(`Handle tenant request for unit ${unit.unitId}`)
                  }
                >
                  Tenant Request
                </button>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600"
                    onClick={() => handleEditUnit(unit.unitId)} // Pass unitId to the handler
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                    onClick={() => alert(`Delete unit ${unit.unitId}`)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
};

export default ViewPropertyPage;
