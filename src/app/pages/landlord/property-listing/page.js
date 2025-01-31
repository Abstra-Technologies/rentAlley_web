'use client';
import React,{use} from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import properties from '../../../data/properties.json'; // Property data
import LandlordLayout from '../layouts/landlordLayouts'; // Layout


const PropertyListingPage = () => {
  const router = useRouter();

  // Handler for editing a property
  const handleEdit = (propertyId, event) => {
    event.stopPropagation(); // Prevent the parent div's onClick from firing
    router.push(`../landlord/property-listing/edit-property/${propertyId}`);
  };


  // Handler for deleting a property
  const handleDelete = (propertyId) => {
    // Placeholder for delete functionality
    alert(`Delete property with ID: ${propertyId}`);
  };

  return (
    <LandlordLayout>
      <div className="flex-1">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white shadow-md">
          <h2 className="text-xl font-bold mb-4 md:mb-0">Property Listings</h2>
          <button
  className="px-4 py-2 mb-6 text-white bg-blue-600 rounded-md hover:bg-blue-700"
  onClick={() => router.push(`../landlord/property-listing/create-property`)}
>
  + Add New Property
</button>

        </div>

        {/* Property Cards */}
        <div className="p-6 space-y-4">
          {properties.map((property) => {
            return (
              <div
                key={property.id}
                onClick={() => router.push(`../landlord/property-listing/view-property/${property.id}`)} // Navigate to ViewPropertyPage
                className="flex flex-col md:flex-row items-center p-4 bg-white rounded-lg shadow-md space-y-4 md:space-y-0 md:space-x-4 cursor-pointer hover:shadow-lg transition-shadow mb-4"
              >
                {/* Property Image */}
                <img
                  src={property.image}
                  alt={property.name}
                  className="w-full md:w-3/12 md:h-36 rounded-lg object-cover"
                />

                {/* Property Details */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold">{property.name}</h3>
                  <p className="text-sm text-gray-600">{property.address}</p>
                  <p className="mt-1 text-sm text-blue-700">{property.type}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                  <button
                    className="px-3 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600"
                    onClick={(event) => handleEdit(property.id, event)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                    onClick={() => handleDelete(property.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LandlordLayout>
  );
};

export default PropertyListingPage;
