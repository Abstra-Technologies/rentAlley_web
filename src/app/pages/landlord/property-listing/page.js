"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation"; // For navigation
// import properties from "../../../data/properties.json"; // Property data
import LandlordLayout from "../layouts/landlordLayouts"; // Layout
import usePropertyStore from "../../../../pages/zustand/propertyStore";
import useAuth from "../../../../../hooks/useSession";

const PropertyListingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, fetchAllProperties, loading, error } = usePropertyStore();

  // // Fetch properties when the page loads
  useEffect(() => {
    if (user?.landlord_id) {
      // Ensure user is not null/undefined
      console.log("Landlord ID:", user.landlord_id);
      fetchAllProperties(user.landlord_id);
    }
  }, [user?.landlord_id]); // Add landlordId to the dependency array

  // Handler for editing a property
  const handleEdit = (propertyId, event) => {
    event.stopPropagation(); // Prevent the parent div's onClick from firing
    router.push(`../landlord/property-listing/edit-property/${propertyId}`);
  };

  const handleView = (propertyId, event) => {
    event.stopPropagation(); // Prevent the parent div's onClick from firing
    router.push(`../landlord/property-listing/view-property/${propertyId}`);
  };

  // Handler for deleting a property
  const handleDelete = async (propertyId, event) => {
    event.stopPropagation(); // Prevent card click from triggering

    // Show confirmation alert
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this property? This action cannot be undone."
    );

    if (!isConfirmed) return; // Stop if user cancels

    try {
      const response = await fetch(
        `/api/propertyListing/propListing?id=${propertyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("Property deleted successfully.");
        fetchAllProperties(user.landlord_id); // Refresh property list
      } else {
        alert("Failed to delete property.");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("An error occurred while deleting the property.");
    }
  };

  // Show loading message if user.landlord_id is not yet available
  if (!user?.landlord_id) {
    return <p className="text-center mt-4">Loading...</p>;
  }

  if (loading)
    return <p className="text-center mt-4">Fetching properties...</p>;
  if (error) return <p className="text-center mt-4 text-red-500">{error}</p>;

  return (
    // <LandlordLayout>
    //   <div className="flex-1">
    //     <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white shadow-md">
    //       <h2 className="text-xl font-bold mb-4 md:mb-0">Property Listings</h2>
    //       <button
    //         className="px-4 py-2 mb-6 text-white bg-blue-600 rounded-md hover:bg-blue-700"
    //         onClick={() =>
    //           router.push(`/pages/landlord/property-listing/create-property`)
    //         }
    //       >
    //         + Add New Property
    //       </button>
    //     </div>

    // {/* Property Cards */}
    // <div className="p-6 space-y-4">
    //   {properties.map((property) => {
    //     return (
    //       <div
    //         key={property.id}
    //         onClick={() =>
    //           router.push(
    //             `../landlord/property-listing/view-property/${property.id}`
    //           )
    //         } // Navigate to ViewPropertyPage where the tenant history will be found including the full property details.
    //         className="flex flex-col md:flex-row items-center p-4 bg-white rounded-lg shadow-md space-y-4 md:space-y-0 md:space-x-4 cursor-pointer hover:shadow-lg transition-shadow mb-4"
    //       >
    // {/* Property Image */}
    //     {/* <img
    //   src={property.image}
    //   alt={property.name}
    //   className="w-full md:w-3/12 md:h-36 rounded-lg object-cover"
    // /> */}

    // {/* Property Details */}
    // <div className="flex-1 text-center md:text-left">
    //   <h3 className="text-lg font-bold">{property.name}</h3>
    //   <p className="text-sm text-gray-600">{property.address}</p>
    //   <p className="mt-1 text-sm text-blue-700">{property.type}</p>
    // </div>

    // {/* Occupied/Unoccupied Status */}
    // <div className="flex flex-col items-end md:items-start md:ml-auto">
    //   <span
    //     className={`px-3 py-1 text-sm font-semibold rounded-md ${
    //       property.status === "Occupied"
    //         ? "bg-green-100 text-green-800"
    //         : property.status === "Unoccupied"
    //         ? "bg-red-100 text-red-800"
    //         : "bg-orange-100 text-orange-800"
    //     }`}
    //   >
    //     {property.status}
    //   </span>

    // {/* Action Buttons */}
    //         <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2">
    //           <button
    //             className="px-3 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600"
    //             onClick={(event) => {
    //               event.stopPropagation();
    //               handleEdit(property.id, event);
    //             }}
    //           >
    //             Edit
    //           </button>
    //           <button
    //             className="px-3 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
    //             onClick={(event) => {
    //               event.stopPropagation();
    //               handleDelete(property.id);
    //             }}
    //           >
    //             Delete
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // })}
    //     </div>
    //   </div>
    // </LandlordLayout>

    <LandlordLayout>
      <div className="flex-1">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white shadow-md">
          <h2 className="text-xl font-bold mb-4 md:mb-0">Property Listings</h2>
          <button
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={() =>
              router.push(`/pages/landlord/property-listing/create-property`)
            }
          >
            + Add New Property
          </button>
        </div>

        {/* Property Cards */}
        <div className="p-6 space-y-4">
          {properties.length === 0 ? (
            <p className="text-center text-gray-500">No properties found.</p>
          ) : (
            properties.map((property) => (
              <div
                key={property.property_id}
                onClick={() =>
                  router.push(
                    `../landlord/property-listing/view-property/${property.property_id}`
                  )
                }
                className="flex flex-col md:flex-row items-center p-4 bg-white rounded-lg shadow-md space-y-4 md:space-y-0 md:space-x-4 cursor-pointer hover:shadow-lg transition-shadow mb-4"
              >
                {/* Property Image */}
                {property.photos.length > 0 ? (
                  <img
                    src={property.photos[0].photo_url} // Display first photo
                    alt={property.property_name}
                    className="w-full md:w-3/12 md:h-36 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full md:w-3/12 md:h-36 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}

                {/* Property Details */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold">
                    {property.property_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {property.street}, {property.city}, {property.province}
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    {property.property_type.charAt(0).toUpperCase() +
                      property.property_type.slice(1)}
                  </p>
                </div>

                {/* Occupied/Unoccupied Status */}
                <div className="flex flex-col items-end md:items-start md:ml-auto">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-md ${
                      property.property_status === "occupied"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {property.property_status.charAt(0).toUpperCase() +
                      property.property_status.slice(1)}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2">
                    <button
                      className="px-3 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600"
                      onClick={(event) =>
                        handleEdit(property.property_id, event)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                      onClick={(event) =>
                        handleDelete(property.property_id, event)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </LandlordLayout>
  );
};

export default PropertyListingPage;
