import React, { useEffect } from "react";
import useSWR from "swr";
import usePropertyStore from "../../zustand/propertyStore";
import axios from "axios";

const fetcher = (url) => axios.get(url).then((res) => res.data);

export const StepOne = () => {
  const { property, setProperty } = usePropertyStore();

  // Use SWR to fetch property types
  const { data, error } = useSWR("/api/propertyListing/propertyTypes", fetcher);

  // Update Zustand store when data is available
  useEffect(() => {
    if (data?.propertyTypes?.length) {
      setProperty({
        propertyType: property.propertyType || data.propertyTypes[0],
      });
    }
  }, [data, setProperty, property.propertyType]);

  if (error) return <p>Failed to load property types.</p>;
  if (!data) return <p>Loading property types...</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  return (
    <div>
      <h1 className="mt-5 text-3xl font-bold mb-4">List New Property</h1>
      <p className="text-gray-600 mb-4">
        List it in the market where renters are waiting!
      </p>

      {/* Form Fields */}
      <form className="space-y-4">
        {/* Property Type Dropdown */}
        <div>
          <label
            htmlFor="propertyType"
            className="block text-sm font-medium text-gray-700"
          >
            Property Type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            value={property.propertyType || ""}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-lg py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
          >
            {data.propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Property Name */}
        <div>
          <label
            htmlFor="propertyName"
            className="block text-sm font-medium text-gray-700"
          >
            Property Name
          </label>
          <input
            type="text"
            id="propertyName"
            name="propertyName"
            placeholder="XYZ Residences"
            value={property.propertyName || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Address Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Street Address
          </label>
          <input
            type="text"
            name="street"
            value={property.street || ""}
            onChange={handleChange}
            placeholder="Enter street name"
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Other Address Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Barangay / District
          </label>
          <input
            type="number"
            name="brgyDistrict"
            value={property.brgyDistrict || ""}
            onChange={handleChange}
            placeholder="Enter barangay or district number"
            min={0}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            City / Municipality
          </label>
          <input
            type="text"
            name="city"
            value={property.city || ""}
            onChange={handleChange}
            placeholder="Enter city"
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            type="number"
            name="zipCode"
            value={property.zipCode || ""}
            onChange={handleChange}
            placeholder="Enter zip code"
            min={0}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Province
          </label>
          <input
            type="text"
            name="province"
            value={property.province || ""}
            placeholder="Enter province"
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </form>
    </div>
  );
};
