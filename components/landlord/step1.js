import React, { useEffect, useRef } from "react";
import usePropertyStore from "../../zustand/property/usePropertyStore";
import axios from "axios";
import { PROPERTY_TYPES } from "../../constant/propertyTypes";
import { PROVINCES_PHILIPPINES } from "../../constant/provinces";
import { useState } from "react";
import dynamic from "next/dynamic";
const PropertyMap = dynamic(() => import("../propertyMap"), {
  ssr: false, // 💡 disables SSR for this component
});
export const StepOne = () => {
  const { property, setProperty } = usePropertyStore();
  const streetRef = useRef(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  useEffect(() => {
    if (!property.propertyType && PROPERTY_TYPES.length > 0) {
      setProperty({ propertyType: PROPERTY_TYPES[0].value });
    }
  }, [property.propertyType, setProperty]);

 useEffect(() => {
    if (!window.google || !streetRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      streetRef.current,
      {
        types: ["geocode"],
        componentRestrictions: { country: "ph" },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = extractAddressComponents(place);

      setProperty({
        ...property,
        street: place.name || "",
        city: address.city || "",
        province: address.province || "",
        brgyDistrict: address.barangay || "",
        zipCode: address.zip || "",
      });
    });
  }, [property, setProperty]);

  // Helper to extract fields from Google's address components
  const extractAddressComponents = (place) => {
    const components = place.address_components || [];
    const result = {
      barangay: "",
      city: "",
      province: "",
      zip: "",
    };

    for (const comp of components) {
      const types = comp.types;
      if (types.includes("postal_code")) result.zip = comp.long_name;
      if (types.includes("administrative_area_level_1")) result.province = comp.long_name;
      if (types.includes("administrative_area_level_2")) result.city = comp.long_name;
      if (types.includes("sublocality_level_1") || types.includes("neighborhood")) result.barangay = comp.long_name;
    }

    return result;
  };

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

      <form className="space-y-4">
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
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

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
 <PropertyMap setCoords={setCoords} />
      <p className="mt-2 text-sm text-gray-600">
        Selected Location: {coords.lat}, {coords.lng}
      </p>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Street Address
          </label>
          <input
            ref={streetRef}
            type="text"
            name="street"
            value={property.street || ""}
            onChange={handleChange}
            placeholder="Enter street name"
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

         <div>
            <label className="block text-sm text-gray-600">Barangay/District</label>
            <input
              type="text"
              value={property.brgyDistrict || ""}
              
              className="w-full p-2 bg-gray-100 border border-gray-200 rounded"
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
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

       <div>
            <label className="block text-sm text-gray-600">Province</label>
            <input
              type="text"
              value={property.province || ""}
              
              className="w-full p-2 bg-gray-100 border border-gray-200 rounded"
            />
          </div>
      </form>
    </div>
  );
};
