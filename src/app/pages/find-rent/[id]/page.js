"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAuth from "../../../../../hooks/useSession";
import InquiryBooking from "../../../../components/tenant/inquiry";
import {
  FaRuler,
  FaCouch,
  FaMapMarkerAlt,
  FaBuilding,
  FaSwimmingPool,
  FaWifi,
  FaUserTie,
} from "react-icons/fa";
import { BsImageAlt, BsCheckCircleFill } from "react-icons/bs";
import {
  MdVerified,
  MdKeyboardArrowRight,
  MdOutlineApartment,
} from "react-icons/md";

export default function PropertyDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPropertyDetails() {
      try {
        const res = await fetch(`/api/properties/getProperty?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch property details");

        const data = await res.json();
        setProperty(data);

        // Set the first available unit as selected by default
        if (data.units && data.units.length > 0) {
          const availableUnit = data.units.find(
            (unit) => unit.status !== "occupied"
          );
          if (availableUnit) {
            setSelectedUnitId(availableUnit.unit_id);
            setSelectedUnit(availableUnit);
          }
        }
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPropertyDetails();
  }, [id]);

  const handleUnitSelection = (unitId) => {
    // Navigate to the unit details page
    router.push(`/pages/find-rent/${id}/${unitId}`);
  };

  // Parse amenities into an array
  const parseAmenities = (amenitiesString) => {
    if (!amenitiesString) return [];
    return amenitiesString.split(",").map((item) => item.trim());
  };

  // Function to get icon for amenity
  const getAmenityIcon = (amenity) => {
    const lowerCaseAmenity = amenity.toLowerCase();
    if (lowerCaseAmenity.includes("pool")) return <FaSwimmingPool />;
    if (
      lowerCaseAmenity.includes("wifi") ||
      lowerCaseAmenity.includes("internet")
    )
      return <FaWifi />;
    return <BsCheckCircleFill />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the property you're looking for.
          </p>
          <button
            onClick={() => router.push("/pages/find-rent")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  const amenities = parseAmenities(property.amenities);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Property Header - Hero Section */}
      <div className="w-full bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                  {property.property_name}
                </h1>
                <MdVerified className="ml-2 text-blue-500 text-xl" />
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <FaMapMarkerAlt className="mr-2 text-gray-400" />
                <span>
                  {property.city}, {property.province}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="container mx-auto px-4 py-6">
        {property.property_photo && property.property_photo.length > 0 ? (
          <div className="relative">
            {/* Main Image */}
            <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg relative">
              <Image
                src={property.property_photo[activeImageIndex]}
                alt={`Main Property Image`}
                fill
                loading="lazy"
                className="object-cover"
              />
            </div>

            {/* Thumbnail Row */}
            {property.property_photo.length > 1 && (
              <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
                {property.property_photo.map((photo, index) => (
                  <div
                    key={index}
                    className={`relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer transition transform hover:scale-105 ${
                      activeImageIndex === index
                        ? "ring-2 ring-blue-500"
                        : "opacity-80"
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <Image
                      src={photo}
                      alt={`Property Thumbnail ${index + 1}`}
                      fill
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <BsImageAlt className="text-4xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No Property Images Available</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Property & Unit Details */}
          <div className="lg:col-span-2">
            {/* Property Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <FaBuilding className="mr-2 text-blue-500" />
                Property Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Property Type</h3>
                  <p className="text-gray-600">
                    {property.property_type.charAt(0).toUpperCase() +
                      property.property_type.slice(1)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Location</h3>
                  <p className="text-gray-600">
                    {property.city}, {property.province}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Total Units</h3>
                  <p className="text-gray-600">{property.units.length} units</p>
                </div>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-700 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-3">
                    {amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                      >
                        {getAmenityIcon(amenity)}
                        <span className="ml-2">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Available Units */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <MdOutlineApartment className="mr-2 text-blue-500" />
                Available Units
              </h2>

              {property.units.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    No available units at this time
                  </p>
                </div>
              ) : (
                <>
                  {/* Units List */}
                  <div className="space-y-4">
                    {property.units.map((unit) => (
                      <div
                        key={unit.unit_id}
                        className={`border p-4 rounded-lg cursor-pointer transition hover:shadow-md ${
                          unit.status === "occupied"
                            ? "opacity-60 cursor-not-allowed"
                            : "border-blue-500 bg-blue-50"
                        }`}
                        onClick={() =>
                          unit.status !== "occupied" &&
                          handleUnitSelection(unit.unit_id)
                        }
                      >
                        <div className="flex flex-col md:flex-row md:items-center">
                          {/* Unit Image */}
                          <div className="w-full md:w-1/4 mb-4 md:mb-0">
                            {unit.photos ? (
                              <div className="relative h-28 w-full rounded-lg overflow-hidden">
                                <Image
                                  src={unit.photos[0]}
                                  alt={unit.unit_name}
                                  fill
                                  loading="lazy"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-28 w-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-sm">
                                  No Image
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Unit Details */}
                          <div className="md:flex-1 md:ml-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {unit.unit_name}
                                </h3>
                                <div className="flex flex-wrap gap-3 mt-2">
                                  <div className="flex items-center text-gray-600 text-sm">
                                    <FaRuler className="mr-1" />
                                    <span>{unit.floor_area} sqm</span>
                                  </div>
                                  <div className="flex items-center text-gray-600 text-sm">
                                    <FaCouch className="mr-1" />
                                    <span>{unit.furnish}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-bold text-lg text-blue-600">
                                  ₱{unit.rent_payment.toLocaleString()}
                                  <span className="text-sm text-gray-500">
                                    {" "}
                                    /month
                                  </span>
                                </div>
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                                    unit.status === "occupied"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-green-100 text-green-600"
                                  }`}
                                >
                                  {unit.status === "occupied"
                                    ? "Occupied"
                                    : "Available"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Landlord Contact */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <FaUserTie className="mr-2 text-blue-500" />
                Contact Landlord
              </h2>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUserTie className="text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Property Manager</p>
                    <p className="text-gray-600 text-sm">
                      Response time: Usually within 24 hours
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/pages/commons/chat?landlord_id=${property.landlord_id}`
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                >
                  <span>Chat Now</span>
                  <MdKeyboardArrowRight />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          {property.units.length > 0 ? (
            <p className="text-3xl font-extrabold text-blue-900 uppercase tracking-wide">
              Choose a unit to proceed with booking.
            </p>
          ) : (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Book a Viewing
                </h2>
                <InquiryBooking
                  tenant_id={user?.tenant_id}
                  property_id={id}
                  unit_id={selectedUnitId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
