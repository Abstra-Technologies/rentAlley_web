"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InquiryBooking from "../../../../../components/tenant/inquiry";
import Image from "next/image";
import useAuth from "../../../../../../hooks/useSession";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import ReviewsList from "../../../../../components/tenant/reviewList";

export default function UnitDetailPage() {
  const router = useRouter();
  const { rentId, id } = useParams();
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

  const isOccupied = unit.status === "occupied";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Photo Gallery */}
      <div className="w-full h-80 sm:h-96 relative rounded-lg overflow-hidden">
        {photos.length > 0 ? (
          <Image
            src={photos[activeImage]}
            alt="Unit Image"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
            No images available
          </div>
        )}
      </div>

      {/* Thumbnail Row */}
      {photos.length > 1 && (
        <div className="flex overflow-x-auto mt-3 space-x-2 pb-2">
          {photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Unit Image ${index + 1}`}
              className={`h-16 w-16 sm:h-20 sm:w-20 rounded-md cursor-pointer border-2 ${
                activeImage === index ? "border-blue-600" : "border-transparent"
              }`}
              onClick={() => setActiveImage(index)}
            />
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="mt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-700 hover:text-gray-900 transition"
        >
          <IoArrowBackOutline className="text-xl sm:text-2xl" />
          <span className="ml-2 text-base sm:text-lg font-medium">Back</span>
        </button>
      </div>

      {/* Status Badge */}
      <div className="mt-4">
        <span
          className={`inline-block px-4 py-2 font-medium rounded-full text-sm ${
            isOccupied
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {isOccupied ? "Currently Occupied" : "Available for Booking"}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left: Unit Details */}
        <div className="lg:col-span-2 bg-white p-6 shadow-md rounded-lg">
          <h1 className="text-2xl font-bold text-gray-800">
            Unit {unit?.unit_name}
          </h1>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Unit Details
            </h3>
            <ul className="mt-2 space-y-2 text-gray-600">
              <li>
                <strong className="text-gray-800">Unit Size:</strong>{" "}
                {unit?.unit_size} sqm
              </li>
              <li>
                <strong className="text-gray-800">Bed Spacing:</strong>{" "}
                {unit?.bed_spacing === 0 ? "No" : "Yes"}
              </li>
              <li>
                <strong className="text-gray-800">Available Beds:</strong>{" "}
                {unit?.bed_spacing === 0 ? "N/A" : unit?.avail_beds}
              </li>
              <li>
                <strong className="text-gray-800">Furnishing:</strong>{" "}
                {unit?.furnish
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </li>
              <li>
                <strong className="text-gray-800">Security Deposit:</strong> ₱{" "}
                {unit?.sec_deposit}
              </li>
              <li>
                <strong className="text-gray-800">Advanced Payment:</strong> ₱{" "}
                {unit?.advanced_payment}
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Inquiry Booking, and Sending Message */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {isOccupied ? (
            <>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-red-500 text-xl mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Unit Currently Occupied
                    </h3>
                    <p className="text-gray-700">
                      This unit is currently rented and not available for
                      booking. You can browse other available units in this
                      property.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => router.push(`/pages/find-rent/${id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View Available Units
                </button>
              </div>
              {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-500 text-xl mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Want to be notified?</h3>
                    <p className="text-gray-600 text-sm">
                      You can sign up to be notified when this unit or similar units become available.
                    </p>
                    <button className="mt-3 w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                      Join Waitlist
                    </button>
                  </div>
                </div>
              </div> */}
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Book This Unit
              </h3>
              {user && user.tenant_id ? (
                <InquiryBooking
                  tenant_id={user.tenant_id}
                  unit_id={unit?.unit_id}
                  rent_amount={unit?.rent_amount}
                  landlord_id={unit?.landlord_id}
                />
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 font-medium mb-2">
                    Login Required
                  </p>
                  <p className="text-gray-600 text-sm">
                    You must be logged in as a tenant to book this unit.
                  </p>
                  <button
                    onClick={() =>
                      router.push(
                        "/login?redirect=" +
                          encodeURIComponent(window.location.pathname)
                      )
                    }
                    className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Log In or Sign Up
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white p-6 shadow-md rounded-lg mt-6">
        <ReviewsList unit_id={unit?.unit_id} landlord_id={user?.landlord_id} />
      </div>
    </div>
  );
}
