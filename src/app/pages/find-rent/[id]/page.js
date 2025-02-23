"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAuth from "../../../../../hooks/useSession";
import InquiryBooking from "../../../../components/tenant/inquiry";

export default function PropertyDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPropertyDetails() {
      try {
        const res = await fetch(`/api/properties/getProperty?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch property details");

        const data = await res.json();
        setProperty(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPropertyDetails();
  }, [id]);

  if (loading) return <p className="text-center text-lg">Loading...</p>;
  if (!property)
    return <p className="text-center text-lg">Property not found.</p>;

  // const handleUnitChange = (e) => {
  //   setSelectedUnitId(e.target.value ? parseInt(e.target.value) : null); // Set selected unit ID
  // };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl text-center font-bold mb-4">
        {property.property_name}
      </h1>

      {/* 🔹 Property Photos Gallery (Max 4 images) */}

      {property.property_photo && property.property_photo.length > 0 ? (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full mb-4">
          {property.property_photo.slice(0, 4).map((photo, index) => (
            <div
              key={index}
              className="relative w-full h-48 md:h-64 lg:h-80 xl:h-96"
            >
              <Image
                src={photo}
                alt={`Property Image ${index + 1}`}
                width={500}
                height={500}
                className={`
                  h-full w-full object-cover
                  ${index === 0 ? "rounded-tl-2xl" : ""}
                  ${index === 1 ? "rounded-tr-2xl" : ""}
                  ${index === 2 ? "rounded-bl-2xl" : ""}
                  ${index === 3 ? "rounded-br-2xl" : ""}
                `}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-[250px] bg-gray-300 flex items-center justify-center rounded-lg mb-3">
          No Property Images Available
        </div>
      )}

      {/* 🔹 Two-column Layout (Details on left, Inquiry Booking on right) */}
      <div className="flex flex-col md:flex-row md:justify-between">
        {/* Left Section: Property Details */}
        <div className="md:w-2/3">
          <p className="text-lg mb-2">
            City: {property.city},
            <br />
            Province: {property.province}
          </p>
          <p className="text-lg mb-2">
            Property Type:{" "}
            {property.property_type.charAt(0).toUpperCase() +
              property.property_type.slice(1)}
          </p>
          <p className="text-lg mb-2">Amenities: {property.amenities}</p>

          {/* 🔹 Unit Details */}
          <h2 className="text-xl font-bold mt-6">Available Units</h2>
          {property.units.length === 0 ? (
            <p>No available units.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Unit (Optional)
              </label>
              <select
                className="mb-4 p-2 border border-gray-300 rounded-md"
                onChange={(e) =>
                  setSelectedUnitId(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                value={selectedUnitId || ""}
              >
                <option value="">No Unit (Optional)</option>
                {property.units.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    {unit.unit_name}
                  </option>
                ))}
              </select>

              {property.units.map((unit) => (
                <div
                  key={unit.unit_id}
                  className="border rounded-lg p-4 shadow-md"
                >
                  <h3 className="text-lg font-semibold">
                    Unit - {unit.unit_name}
                  </h3>
                  <p className="text-gray-600">
                    Floor Area: {unit.floor_area} sqm
                  </p>
                  <p className="text-gray-600">Furnish: {unit.furnish}</p>
                  <p className="text-blue-500 font-semibold">
                    ₱{unit.rent_payment}/month
                  </p>
                  <p
                    className={`text-sm ${
                      unit.status === "occupied"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {unit.status === "occupied" ? "Occupied" : "Available"}
                  </p>

                  {/* Unit Image */}
                  {unit.photos ? (
                    <Image
                      src={unit.photos[0]}
                      alt={unit.unit_name}
                      width={200}
                      height={100}
                      className="rounded-lg mt-2"
                    />
                  ) : (
                    <div className="w-[300px] h-[200px] bg-gray-300 flex items-center justify-center mt-2">
                      No Unit Image
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Inquiry Booking */}
        <div className="md:w-1/3 md:ml-6">
          <InquiryBooking
            tenant_id={user?.tenant_id}
            property_id={id}
            unit_id={selectedUnitId}
          />
        </div>
      </div>

      {/* 🔹 Chat with Landlord */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Chat</h2>
        {property.landlord_id && (
          <button
            onClick={() =>
              router.push(
                `/pages/commons/chat?landlord_id=${property.landlord_id}`
              )
            }
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Chat with Landlord
          </button>
        )}
      </div>
    </div>
  );
}
