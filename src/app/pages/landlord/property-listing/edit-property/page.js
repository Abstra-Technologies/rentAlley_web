"use client";
import React from "react";

export default function EditPropertyPage({ params }) {
    const { id } = params;
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Property (ID: {id})</h1>
      <form className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        {/* Property Name */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="name"
          >
            Property Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter property name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
          />
        </div>

        {/* Address */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="address"
          >
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            placeholder="Enter property address"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
          />
        </div>

        {/* Property Type */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="type"
          >
            Property Type
          </label>
          <select
            id="type"
            name="type"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50"
          >
            <option value="Apartment">Apartment</option>
            <option value="Dormitory">Dormitory</option>
            <option value="House">House</option>
            <option value="Office">Office</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="image"
          >
            Property Image
          </label>
          <input
            type="file"
            id="image"
            name="image"
            className="mt-1 block w-full text-gray-700"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 text-blue-700 bg-white border border-blue-500 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}