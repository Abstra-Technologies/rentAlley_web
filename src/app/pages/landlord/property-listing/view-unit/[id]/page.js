"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";

const fetcher = (url) => axios.get(url).then((res) => res.data);

// To Do:
// Add units base on predetermined number to avoid abuse of adding units.

const ViewUnitPage = () => {
  const { id } = useParams();
  const router = useRouter();

  // Fetch property details
  const { data: property } = useSWR(
    id ? `/api/propertyListing/property/${id}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  // Fetch units for the specific property
  const { data: units, error } = useSWR(
    id ? `/api/unitListing/unit?property_id=${id}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  // Handle Edit Unit
  const handleEditUnit = (unitId) => {
    // Navigate to the edit page for the specific unit
    router.push(
      `/pages/landlord/property-listing/view-unit/${id}/edit-unit/${unitId}`
    );
  };

  // Function to navigate to Create Unit page with property_id
  const handleAddUnitClick = () => {
    router.push(
      `/pages/landlord/property-listing/view-unit/${id}/create-unit?property_id=${id}`
    );
  };

  // Function to handle deleting a unit
  const handleDeleteUnit = async (unitId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`/api/unitListing/unit?id=${unitId}`);

      // Update the UI by revalidating the SWR cache
      mutate(`/api/propertyListing/property/${id}`);
      mutate(`/api/unitListing/unit?property_id=${id}`);
      Swal.fire("Deleted!", "Unit has been deleted.", "success");
    } catch (error) {
      console.error("Error deleting unit:", error);
      Swal.fire(
        "Error",
        "Failed to delete the unit. Please try again.",
        "error"
      );
    }
  };

  if (error) return <p>Failed to load units.</p>;
  if (!units) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Property Header */}
      <h1 className="text-3xl font-bold mb-2">
        {property?.property_name || ""}
      </h1>

      {/* Add New Unit Button */}
      <button
        className="px-4 py-2 mb-6 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        onClick={handleAddUnitClick}
      >
        + Add New Unit
      </button>

      {/* Units Section */}
      {units.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {units.map((unit) => (
            <div
              key={unit.unit_id} // Add a unique key prop
              className="p-4 bg-white rounded-lg shadow-md space-y-4 hover:shadow-lg transition-shadow"
            >
              {/* Unit Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Unit {unit.unit_name}</h3>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-md ${
                    unit.status === "Occupied"
                      ? "bg-green-100 text-green-800"
                      : unit.status === "Unoccupied"
                      ? "bg-red-100 text-red-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                </span>
              </div>

              {/* Unit Details */}
              <p className="text-sm text-gray-600">{unit.description}</p>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-4">
                <button
                  className="px-3 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  onClick={() =>
                    alert(`Handle tenant request for unit ${unit.unit_id}`)
                  }
                >
                  Tenant Request
                </button>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600"
                    onClick={() => handleEditUnit(unit.unit_id)} // Pass unitId to the handler
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                    onClick={() => handleDeleteUnit(unit.unit_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg font-semibold">
          No Units Available
        </p>
      )}
    </div>
  );
};

export default ViewUnitPage;
