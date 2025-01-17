"use client";
import React from "react";
import { useRouter } from "next/navigation";
import properties from "../../../../../data/properties.json";
import LandlordLayout from "../../../layouts/landlordLayouts";

const ViewPropertyPage = ({ params }) => {
  const { id } = params; // Access the dynamic route parameter
  const router = useRouter();

  // Find the property based on the id
  const property = properties.find((property) => property.id === id);

  if (!id) {
    return <div className="p-6">Loading...</div>;
  }

  if (!property) {
    return <div className="p-6">Property not found.</div>;
  }

  return (
    <LandlordLayout>
      <div className="flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white shadow-md">
          <h2 className="text-xl font-bold">{property.name}</h2>
          <button
            onClick={() => router.push("../landlord/property-listing")}
            className="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700"
          >
            Back to Listings
          </button>
        </div>

        {/* Property Details */}
        <div className="p-6 space-y-4">
          {/* Property Image */}
          <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
            <img
              src={property.image}
              alt={property.name}
              className="w-full md:w-1/3 rounded-lg shadow-md object-cover"
            />
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-bold">{property.name}</h3>
              <p className="text-gray-600">{property.address}</p>
              <p className="text-sm text-blue-500">{property.type}</p>

              {/* Placeholder for tenant request */}
              <div className="flex flex-wrap items-center space-x-4">
                <span className={`px-3 py-1 text-white rounded-md bg-green-500`}>
                  Occupied
                </span>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Tenant Request
                </button>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">
                Additional Info
              </h4>
              <p className="text-gray-600">Placeholder data</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.push(`/properties/${property.id}/edit`)}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Edit
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              onClick={() => alert("Delete functionality not implemented yet")}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
};

export default ViewPropertyPage;
