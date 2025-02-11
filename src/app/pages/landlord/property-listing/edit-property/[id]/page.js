"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import LandlordLayout from "../../../layouts/landlordLayouts";

export default function EditPropertyPage() {
  const router = useRouter();
  // const { id } = useParams(); // Get the property ID from the URL
  // const [property, setProperty] = useState(null);

  // Property types
  const propertyTypes = [
    "Apartment",
    "Townhouses",
    "House",
    "Duplex",
    "Dormitories",
  ];

  // Fetch property data based on ID
  // useEffect(() => {
  //   const fetchProperty = async () => {
  //     try {
  //       const response = await fetch(`/api/properties/${id}`); // Replace with your API endpoint
  //       const data = await response.json();
  //       setProperty(data);
  //     } catch (error) {
  //       console.error("Failed to fetch property:", error);
  //     }
  //   };

  //   fetchProperty();
  // }, [user_id]);

  // Handle form submission
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const response = await fetch(`/api/properties/${id}`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(property),
  //     });

  //     if (response.ok) {
  //       router.push("/pages/landlord/property-listing"); // Redirect after successful details
  //     } else {
  //       console.error("Failed to details property");
  //     }
  //   } catch (error) {
  //     console.error("Error updating property:", error);
  //   }
  // };

  // Handle input changes
  // const handleChange = (e) => {
  //   const { id, value } = e.target;
  //   setProperty((prev) => ({
  //     ...prev,
  //     [user_id]: value,
  //   }));
  // };

  // if (!property) {
  //   return <p>Loading...</p>; // Show loading state while fetching data
  // }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <LandlordLayout>
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1 p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-2">Edit Property</h1>
              <p className="text-gray-600 mb-6">Update your property details.</p>

              <form className="space-y-4"> 
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="property-type">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  >
                    {propertyTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Other form fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="buildingName">
                    Building Name
                  </label>
                  <input
                    type="text"
                    id="buildingName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="streetAddress">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="barangay">
                    Barangay / District (if applicable)
                  </label>
                  <input
                    type="text"
                    id="barangay"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="city">
                    City / Municipality
                  </label>
                  <input
                    type="text"
                    id="city"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="zipCode">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="province">
                    Province
                  </label>
                  <input
                    type="text"
                    id="province"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-blue-700 bg-white border border-blue-500 rounded-md hover:bg-gray-50"
                    onClick={() => router.push("/pages/landlord/property-listing")}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </LandlordLayout>
    </div>
  );
}