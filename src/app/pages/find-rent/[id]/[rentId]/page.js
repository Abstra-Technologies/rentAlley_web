"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InquiryBooking from "../../../../../components/tenant/inquiry";
import Image from "next/image";
import useAuth from "../../../../../../hooks/useSession";
import { IoArrowBackOutline } from "react-icons/io5";

export default function UnitDetailPage() {
  const router = useRouter();
  const { rentId } = useParams();
  const { user } = useAuth();

  const [unit, setUnit] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!rentId) return;

    async function fetchUnitDetails() {
      try {
        const res = await fetch(`/api/properties/getUnit?rentId=${rentId}`);
        if (!res.ok) throw new Error("Failed to fetch unit details");

        const data = await res.json();
        setUnit(data.unit[0]);
        setPhotos(data.photos);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUnitDetails();
  }, [rentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Unit Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the unit you're looking for.
          </p>
          <button
            onClick={() => router.push(`/pages/find-rent`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Photo Gallery */}
      <div className="w-full h-96 relative">
        {photos.length > 0 ? (
          <Image
            src={photos[activeImage]}
            alt="Unit Image"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        ) : (
          <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500">
            No images available
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex overflow-x-auto mt-2 space-x-2">
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo}
            alt={`Unit Image ${index + 1}`}
            className={`h-20 w-20 rounded cursor-pointer ${
              activeImage === index ? "border-2 border-blue-600" : ""
            }`}
            onClick={() => setActiveImage(index)}
          />
        ))}
      </div>

      {/* Back Button */}
      <div className="mt-3 mb-3">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-700 hover:text-gray-900"
        >
          <IoArrowBackOutline className="text-2xl" />
          <span className="ml-2 text-lg font-medium">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Left: Unit Details */}
        <div className="md:col-span-2 bg-white p-6 shadow-lg rounded-lg">
          <h1 className="text-2xl font-bold">Unit {unit?.unit_name}</h1>
          <p className="text-gray-600 mt-2">{unit?.description}</p>

          <div className="mt-4">
            <h3 className="text-lg font-semibold">Details</h3>
            <ul className="list-disc list-inside text-gray-700">
              <li>Floor Area: {unit?.floor_area ?? "N/A"} sqm</li>
              <li>Furnishing: {unit?.furnish ?? "N/A"}</li>
              <li>Pet Friendly: {unit?.pet_friendly ? "Yes" : "No"}</li>
              <li>Security Deposit: P{unit?.sec_deposit?.toLocaleString()}</li>
              <li>Min Stay: {unit?.min_stay} months</li>
              <li>Late Fee: P{unit?.late_fee?.toLocaleString()}</li>
              <li>Advanced Payment: {unit?.advanced_payment} months</li>
              <li>
                Electricity Bill Included:{" "}
                {unit?.has_electricity ? "Yes" : "No"}
              </li>
              <li>Water Bill Included: {unit?.has_water ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>

        {/* Right: Inquiry Booking */}
        <div className="bg-white p-6 shadow-lg rounded-lg">
          <InquiryBooking
            tenant_id={user?.tenant_id}
            property_id={""}
            unit_id={unit?.unit_id}
            rent_payment={unit?.rent_payment}
          />
        </div>
      </div>
    </div>
  );
}
