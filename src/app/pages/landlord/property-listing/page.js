"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation"; // For navigation
import LandlordLayout from "../../../../components/navigation/sidebar-landlord"; // Layout
import usePropertyStore from "../../../../pages/zustand/propertyStore";
import useAuth from "../../../../../hooks/useSession";
import Image from "next/image";
import axios from "axios";

// To Follow:
// - Implement Subscription Limit Here.
// - If Landlord is not verified no property listing.

const PropertyListingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, fetchAllProperties, loading, error } = usePropertyStore();
  const [isVerified, setIsVerified] = useState(null);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [isFetchingVerification, setIsFetchingVerification] = useState(true); // ✅ Track loading state
  const [fetchingSubscription, setFetchingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user?.landlord_id) {
      // Ensure user is not null/undefined
      console.log("Landlord ID:", user.landlord_id);
      fetchAllProperties(user.landlord_id);
    }
  }, [user?.landlord_id]);

  useEffect(() => {
    if (user?.userType === "landlord") {
      setIsVerified(null);
      setIsFetchingVerification(true);

      axios
          .get(`/api/landlord/verification-status?user_id=${user.user_id}`)
          .then((response) => {
            console.log("✅ Fetched Verification Status:", response.data);
            setIsVerified(response.data.is_verified);
          })
          .catch((err) => {
            console.error("Failed to fetch landlord verification status:", err);
          })
          .finally(() => {
            setIsFetchingVerification(false);
          });

      setFetchingSubscription(true);
      axios
          .get(`/api/subscription/getCurrentPlan/${user.landlord_id}`)
          .then((response) => {
            setSubscription(response.data);
          })
          .catch((err) => {
            console.error(" Failed to fetch subscription:", err);
          })
          .finally(() => setFetchingSubscription(false));
    }
  }, [user]);

  const handleEdit = (propertyId, event) => {
    event.stopPropagation(); // Prevent the parent div's onClick from firing
    router.push(`../landlord/property-listing/edit-property/${propertyId}`);
  };

  const handleView = useCallback((property, event) => {
    event.stopPropagation(); // Prevent the parent div's onClick from firing
    router.push(
      `../landlord/property-listing/view-unit/${property.property_id}`
    );
  });

  const handleAddProperty = () => {
    if (!isVerified) {
      setShowVerifyPopup(true);
      return;
    }

    // subscription handling goes here.
// listing limit comes from api backend.
    if(subscription && properties.length >= subscription.listingLimits.maxProperties){
      alert(`🚨 You have reached the maximum property limit (${subscription.listingLimits.maxProperties}) for your plan.`);
      return;
    }
    router.push(`/pages/landlord/property-listing/create-property`);
  };

  const handleTenantRequest = (propertyId, event) => {
    event.stopPropagation();
    router.push(
      `/pages/landlord/property-listing/tenant-req?property_id=${propertyId}`
    );
  };

  const handleDelete = useCallback(async (propertyId, event) => {
    event.stopPropagation(); // Prevent card click from triggering

    const isConfirmed = window.confirm(
      "Are you sure you want to delete this property? This action cannot be undone."
    );

    if (!isConfirmed) return; // Stop if user cancels

    try {
      const response = await fetch(
        `/api/propertyListing/propListing?id=${propertyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("Property deleted successfully.");
        fetchAllProperties(user.landlord_id); // Refresh property list
      } else {
        alert("Failed to delete property.");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("An error occurred while deleting the property.");
    }
  });

  if (!user?.landlord_id) {
    return <p className="text-center mt-4">Loading...</p>;
  }

  if (loading)
    return <p className="text-center mt-4">Fetching properties...</p>;
  if (error) return <p className="text-center mt-4 text-red-500">{error}</p>;

  return (
    <LandlordLayout>
      <div className="flex-1">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white shadow-md">
          <h2 className="text-xl font-bold mb-4 md:mb-0">Property Listings</h2>
          {subscription && (
              <p className="text-gray-600 text-sm">
                {`You can list up to ${subscription.listingLimits.maxProperties} properties.`}
                {` (${properties.length}/${subscription.listingLimits.maxProperties} used)`}
              </p>
          )}
          <button
              className={`px-4 py-2 rounded-md font-bold ${
                  isFetchingVerification
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed" // 🔄 Show "Checking..."
                      : isVerified
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
              onClick={handleAddProperty}
              disabled={isFetchingVerification || !isVerified}
          >
            {isFetchingVerification ? "Checking..." : "+ Add New Property"}
          </button>
        </div>

        <div className="p-6 space-y-4">
          {properties.length === 0 ? (
            <p className="text-center text-gray-500">No properties found.</p>
          ) : (
            properties.map((property) => (
              <div
                key={property.property_id}
                onClick={(event) => handleView(property, event)}
                className="flex flex-col md:flex-row items-center p-4 bg-white rounded-lg shadow-md space-y-4 md:space-y-0 md:space-x-4 cursor-pointer hover:shadow-lg transition-shadow mb-4"
              >
                {/* Property Image */}
                {property.photos.length > 0 ? (
                  <Image
                    src={property.photos[0].photo_url}
                    alt={property.property_name}
                    width={400} // Set a reasonable width
                    height={250} // Set a reasonable height
                    className="w-full md:w-3/12 md:h-36 rounded-lg object-cover"
                    style={{ objectFit: "cover" }} // Ensures image covers its container
                  />
                ) : (
                  <div className="w-full md:w-3/12 md:h-36 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}

                {/* Property Details */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold">
                    {property.property_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {property.street}, {property.city}, {property.province}
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    {property.property_type.charAt(0).toUpperCase() +
                      property.property_type.slice(1)}
                  </p>
                </div>

                {/* Occupied/Unoccupied Status */}
                <div className="flex flex-col items-end md:items-start md:ml-auto">
                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2">
                    <button
                      className="px-3 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600"
                      onClick={(event) =>
                        handleEdit(property.property_id, event)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                      onClick={(event) =>
                        handleDelete(property.property_id, event)
                      }
                    >
                      Delete
                    </button>

                    <button
                      className="px-3 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600"
                      onClick={(event) =>
                        handleTenantRequest(property.property_id, event)
                      }
                    >
                      Tenant Request
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {showVerifyPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-bold">Verification Required</h3>
              <p className="mt-2">
                You need to verify your account before adding a property.
              </p>
              <button
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={() => setShowVerifyPopup(false)}
              >
                Okay
              </button>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
};

export default PropertyListingPage;
