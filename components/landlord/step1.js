import React, { useEffect, useRef, useState } from "react";
import usePropertyStore from "../../zustand/property/usePropertyStore";
import { PROPERTY_TYPES } from "../../constant/propertyTypes";
import dynamic from "next/dynamic";
const PropertyMap = dynamic(() => import("../propertyMap"), { ssr: false });

export const StepOne = () => {
  const { property, setProperty } = usePropertyStore();
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState([]);

  // Set default property type if not set
  useEffect(() => {
    if (!property.propertyType && PROPERTY_TYPES.length > 0) {
      setProperty({ propertyType: PROPERTY_TYPES[0].value });
    }
  }, [property.propertyType]);

  // Debounced OSM search for address input
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (addressQuery.length < 4) {
        setAddressResults([]);
        return;
      }

      try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                addressQuery
            )}&addressdetails=1&countrycodes=ph`
        );
        const data = await res.json();
        setAddressResults(data);
      } catch (err) {
        console.error("Address search failed", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [addressQuery]);

  const handleAddressSelect = (place) => {
    const { lat, lon, display_name, address } = place;

    const parsed = {
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      street: address.road || display_name,
      brgyDistrict: address.suburb || address.neighbourhood || "",
      city: address.city || address.town || address.village || "",
      province: address.region || "",
      zipCode: address.postcode || "",
    };

    setCoords({ lat: parsed.lat, lng: parsed.lng });
    setProperty({ ...property, ...parsed });
    setAddressQuery(parsed.street);
    setAddressResults([]);
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
            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700">
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

          <PropertyMap
              coordinates={coords.lat && coords.lng ? [coords.lat, coords.lng] : null}
              setFields={({ lat, lng, address, barangay, city, province, region, postcode }) => {
                setCoords({ lat, lng });
                setProperty({
                  ...property,
                  lat,
                  lng,
                  street: address,
                  brgyDistrict: barangay,
                  city,
                  province: region,
                  zipCode: postcode || "",
                });
                setAddressQuery(address);
              }}
          />

          <p className="mt-2 text-sm text-gray-600">
            Selected Location: {coords.lat}, {coords.lng}
          </p>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
                type="text"
                name="street"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                placeholder="Search address"
                className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {addressResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-auto">
                  {addressResults.map((result, index) => (
                      <li
                          key={index}
                          onClick={() => handleAddressSelect(result)}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {result.display_name}
                      </li>
                  ))}
                </ul>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600">Barangay/District</label>
            <input
                type="text"
                value={property.brgyDistrict || ""}
                readOnly
                className="w-full p-2 bg-gray-100 border border-gray-200 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City / Municipality</label>
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
            <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
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
                readOnly
                className="w-full p-2 bg-gray-100 border border-gray-200 rounded"
            />
          </div>
        </form>
      </div>
  );
};
