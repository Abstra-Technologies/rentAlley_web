"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Home,
  PlusCircle,
  Building2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";

interface Props {
  landlordId: number | undefined;
}

export default function LandlordPropertyMarquee({ landlordId }: Props) {
  const router = useRouter();
  const { properties, loading, fetchAllProperties } = usePropertyStore();
  const { subscription, loading: subscriptionLoading } =
    useSubscription(landlordId);
  const { user } = useAuthStore(); // ✅ Get user for verification check

  useEffect(() => {
    if (landlordId) fetchAllProperties(landlordId);
  }, [landlordId, fetchAllProperties]);

  /* =========================
       SUBSCRIPTION LIMIT LOGIC
    ========================== */
  const maxProperties = subscription?.limits?.maxProperties ?? null;
  const totalCount = properties?.length || 0;
  const isLimitReached = maxProperties !== null && totalCount >= maxProperties;

  /* =========================
       VERIFICATION CHECK
    ========================== */
  const isVerified = user?.isVerified === true;

  /* =========================
       COMBINED DISABLE LOGIC
    ========================== */
  const isAddDisabled = !isVerified || isLimitReached;

  /* =========================
       HANDLE ADD PROPERTY
    ========================== */
  const handleAddProperty = () => {
    // ✅ Check verification first
    if (!isVerified) {
      Swal.fire({
        icon: "warning",
        title: "Account Not Verified",
        html: `
                    <p class="text-gray-600 mb-3">
                        You must verify your account before adding properties.
                    </p>
                    <p class="text-gray-600">
                        Please check your email for the verification link or request a new one.
                    </p>
                `,
        confirmButtonText: "Go to Verification",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/pages/landlord/verification"); // Adjust path as needed
        }
      });
      return;
    }

    // ✅ Check subscription limit
    if (isLimitReached) {
      Swal.fire({
        icon: "warning",
        title: "Property Limit Reached",
        html: `
                    <p class="text-gray-600 mb-3">
                        You've reached your plan's limit of <strong>${maxProperties}</strong> properties.
                    </p>
                    <p class="text-gray-600">
                        Upgrade your subscription to add more properties.
                    </p>
                `,
        confirmButtonText: "View Plans",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/pages/landlord/subscription");
        }
      });
      return;
    }

    // ✅ Only navigate if verified AND within limit
    router.push("/pages/landlord/property-listing/create-property");
  };

  /* =========================
       LOADING STATE
    ========================== */
  if (loading || subscriptionLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 h-[500px]">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="space-y-3 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =========================
       EMPTY STATE
    ========================== */
  if (!properties || properties.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 h-[500px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">
          No Properties Yet
        </h3>
        <p className="text-sm text-gray-600 mb-4 max-w-xs">
          Start by adding your first property to manage your units.
        </p>

        {/* Subscription Info */}
        {subscription && (
          <div className="mb-4 text-xs text-gray-500">
            <span className="font-semibold">
              {totalCount} / {maxProperties === null ? "∞" : maxProperties}
            </span>{" "}
            properties used
          </div>
        )}

        <button
          onClick={handleAddProperty}
          disabled={isAddDisabled}
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            isAddDisabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-sm hover:shadow-md"
          }`}
        >
          {!isVerified ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              Account Not Verified
            </>
          ) : isLimitReached ? (
            <>
              <Lock className="w-4 h-4" />
              Limit Reached
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              Add Property
            </>
          )}
        </button>

        {/* Show appropriate action button */}
        {!isVerified ? (
          <button
            onClick={() => router.push("/pages/landlord/verification")}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Verify Account →
          </button>
        ) : isLimitReached ? (
          <button
            onClick={() => router.push("/pages/landlord/subscription")}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Upgrade Plan →
          </button>
        ) : null}
      </div>
    );
  }

  const limitedProperties = properties.slice(0, 5);

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4
      transition-all duration-300
      hover:shadow-md hover:ring-1 hover:ring-blue-100
      hover:-translate-y-[1px]
      space-y-3 h-[500px] flex flex-col"
    >
      {/* Header with Subscription Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full" />
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            Your Properties
          </h2>
        </div>

        {/* Subscription Counter */}
        {subscription && (
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                isLimitReached
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              }`}
            >
              {totalCount} / {maxProperties === null ? "∞" : maxProperties}
            </div>
          </div>
        )}
      </div>

      {/* Add Property Button */}
      <button
        onClick={handleAddProperty}
        disabled={isAddDisabled}
        type="button"
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all ${
          isAddDisabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 opacity-60"
            : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-sm hover:shadow-md"
        }`}
      >
        {!isVerified ? (
          <>
            <AlertTriangle className="w-4 h-4" />
            Account Not Verified
          </>
        ) : isLimitReached ? (
          <>
            <Lock className="w-4 h-4" />
            Property Limit Reached
          </>
        ) : (
          <>
            <PlusCircle className="w-4 h-4" />
            Add New Property
          </>
        )}
      </button>

      {/* Warning Alert Box */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-900 mb-1">
                Account Not Verified
              </p>
              <p className="text-xs text-amber-700 mb-2">
                Verify your account to add properties
              </p>
              <button
                onClick={() => router.push("/pages/landlord/verification")}
                className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline"
              >
                Verify Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Alert Box */}
      {isVerified && isLimitReached && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-900 mb-1">
                Plan Limit Reached
              </p>
              <p className="text-xs text-red-700 mb-2">
                Upgrade to add more properties
              </p>
              <button
                onClick={() => router.push("/pages/landlord/subscription")}
                className="text-xs font-semibold text-red-900 hover:text-red-950 underline"
              >
                View Plans →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SLIDER */}
      <div className="md:hidden overflow-x-auto flex gap-3 pb-2 snap-x snap-mandatory scrollbar-hide">
        {limitedProperties.map((property) => (
          <div
            key={property.property_id}
            onClick={() =>
              router.push(`/pages/landlord/properties/${property.property_id}`)
            }
            className="snap-start min-w-[220px]
            bg-gray-50 rounded-lg overflow-hidden
            cursor-pointer flex-shrink-0
            border border-gray-100
            transition-all duration-200
            hover:bg-gray-100 hover:shadow-sm hover:ring-1 hover:ring-blue-100"
          >
            <div className="relative w-full h-28 bg-gray-100">
              {property.photos?.[0]?.photo_url ? (
                <Image
                  src={property.photos[0].photo_url}
                  alt={property.property_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Home className="w-10 h-10" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                {property.property_name}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                {[property?.street, property?.city, property?.province]
                  .filter(Boolean)
                  .join(", ") || "Address not specified"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP LIST */}
      <div className="hidden md:block flex-1 overflow-y-auto divide-y divide-gray-100">
        {limitedProperties.map((property) => (
          <div
            key={property.property_id}
            onClick={() =>
              router.push(`/pages/landlord/properties/${property.property_id}`)
            }
            className="flex items-center gap-3 p-2.5 rounded-lg
            cursor-pointer transition-all duration-200
            hover:bg-gray-50 hover:shadow-sm hover:ring-1 hover:ring-blue-100"
          >
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
              {property.photos?.length > 0 ? (
                <Image
                  src={property.photos[0].photo_url}
                  alt={property.property_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {property.property_name}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                {[property?.street, property?.city, property?.province]
                  .filter(Boolean)
                  .join(", ") || "Address not specified"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All */}
      {properties.length > 5 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/pages/landlord/property-listing`);
          }}
          className="w-full text-center text-sm font-medium
          text-blue-600 hover:text-blue-700
          py-2 transition-colors"
        >
          View All Properties ({properties.length}) →
        </button>
      )}
    </div>
  );
}
