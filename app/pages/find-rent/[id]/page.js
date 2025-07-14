"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaRuler,
  FaCouch,
  FaBuilding,
  FaSwimmingPool,
  FaWifi,
  FaInfoCircle,
} from "react-icons/fa";
import { BsImageAlt, BsCheckCircleFill } from "react-icons/bs";
import { MdVerified, MdOutlineApartment } from "react-icons/md";
import { IoArrowBackOutline } from "react-icons/io5";
import Swal from "sweetalert2";

export default function PropertyDetails() {
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
    Swal.fire({
      title: "Redirecting...",
      text: "Please wait while we load the unit details...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    setTimeout(() => {
      Swal.close();
      router.push(`/pages/find-rent/${id}/${unitId}`);
    }, 1500);
  };

  const handleRedirectContactUs = () => {
    router.push("/pages/contact-us");
  };

  const parseAmenities = (amenitiesString) => {
    if (!amenitiesString) return [];
    return amenitiesString.split(",").map((item) => item.trim());
  };

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
      <div className="w-full bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                  {property?.property_name}
                </h1>
                <MdVerified className="ml-2 text-blue-500 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {property?.property_photo && property?.property_photo.length > 0 ? (
          <div className="relative">
            <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg relative">
              <Image
                src={property?.property_photo[activeImageIndex]}
                alt={`Main Property Image`}
                fill
                loading="lazy"
                className="object-cover"
              />
            </div>

            {property?.property_photo.length > 1 && (
              <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
                {property?.property_photo.map((photo, index) => (
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
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <IoArrowBackOutline className="text-2xl" />
            <span className="ml-2 text-lg font-medium">Back</span>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Property & Unit Details */}
          <div className="lg:col-span-2">
            {/* Property Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 pl-12 relative">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <FaBuilding className="mr-2 text-blue-500" />
                Property Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Property Type</h3>
                  <p className="text-gray-600">
                    {property?.property_type.charAt(0).toUpperCase() +
                      property?.property_type.slice(1)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Location</h3>
                  <p className="text-gray-600">
                    {property?.city},{" "}
                    {property?.province
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Total Units</h3>
                  <p className="text-gray-600">{property.units.length} units</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Floor Area</h3>
                  <p className="text-gray-600">{property.floor_area} sqm</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Minimum Stay</h3>
                  <p className="text-gray-600">{property.min_stay} month</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Late Fee</h3>
                  <p className="text-gray-600">{property.late_fee} %</p>
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

            {/* Property Description */}
            {property?.description && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 pl-12 relative">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-500" />
                  Property Description
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {property.description.split("\n").map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
            )}

            {/* Available Units */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <MdOutlineApartment className="mr-2 text-blue-500" />
                All Units
              </h2>

              {property.units.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    No units available at this time
                  </p>
                </div>
              ) : (
                <>
                  {/* Units List */}
                  <div className="space-y-4">
                    {property.units.map((unit) => {
                      const isOccupied = unit.status === "occupied";
                      return (
                        <div
                          key={unit.unit_id}
                          className={`border p-4 rounded-lg cursor-pointer transition hover:shadow-md ${
                            isOccupied
                              ? "border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100"
                              : "border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100"
                          }`}
                          onClick={() => handleUnitSelection(unit.unit_id)}
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
                                      <span>{unit.unit_size} sqm</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                      <FaCouch className="mr-1" />
                                      <span>
                                        {unit.furnish
                                          .split("_")
                                          .map(
                                            (word) =>
                                              word.charAt(0).toUpperCase() +
                                              word.slice(1)
                                          )
                                          .join(" ")}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="font-bold text-lg text-blue-600">
                                    ₱{unit.rent_amount.toLocaleString()}
                                    <span className="text-sm text-gray-500">
                                      {" "}
                                      /month
                                    </span>
                                  </div>
                                  <span
                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      isOccupied
                                        ? "bg-red-100 text-red-600"
                                        : "bg-green-100 text-green-600"
                                    }`}
                                  >
                                    {isOccupied ? "Occupied" : "Available"}
                                  </span>
                                </div>
                              </div>

                              {/* View Details Button */}
                              <div className="mt-3 flex justify-end">
                                <button
                                  className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center transition ${
                                    isOccupied
                                      ? "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 text-blue-800">
                Unit Status Guide
              </h2>
              <p className="text-gray-600 mb-4">
                Click on any unit to view detailed information. You can inquire
                and schedule visits only for available units.
              </p>

              <div className="flex items-center mt-4 p-2 border-l-4 border-green-500 bg-green-50">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-green-800">Available for booking</span>
              </div>

              <div className="flex items-center mt-2 p-2 border-l-4 border-red-500 bg-red-50">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-red-800">Occupied - view only</span>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
                <p className="text-gray-600 text-sm">
                  If you have questions about any unit or need assistance with
                  booking, please contact our support team.
                </p>
                <button
                  onClick={handleRedirectContactUs}
                  className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
