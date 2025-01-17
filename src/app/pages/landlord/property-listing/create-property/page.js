"use client"
import React from 'react';
import LandlordLayout from '../../layouts/landlordLayouts';
import { useRouter } from 'next/navigation';


export default function AddNewProperty() {

  const router = useRouter();

  // Property types
  const propertyTypes = [
    "Apartment",
    "Townhouses",
    "House",
    "Duplex",
    "Dormitories",
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <LandlordLayout>
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1 p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-2">List new property</h1>
              <p className="text-gray-600 mb-6">List in the market where renters are waiting!</p>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="property-type">
                    Property Type
                  </label>
                  <select
                    id="property-type"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  >
                    {/* Dynamically rendering dropdown options */}
                    {propertyTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Other form fields (same as before) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="building-name">
                    Building Name
                  </label>
                  <input
                    type="text"
                    id="building-name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 text-lg py-2 px-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="street-address">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street-address"
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
                  <label className="block text-sm font-medium text-gray-700" htmlFor="zip-code">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zip-code"
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
                    onClick={() => router.push('../property-listing')}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Create
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
