"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Home,
  PlusCircle,
  Building2,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";

import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import {
  CARD_CONTAINER,
  CARD_HOVER,
  SECTION_HEADER,
  GRADIENT_DOT,
  SECTION_TITLE,
  ITEM_BASE,
  GRADIENT_PRIMARY,
  EMPTY_STATE_ICON,
  EMPTY_STATE_TITLE,
  EMPTY_STATE_DESC,
  CUSTOM_SCROLLBAR,
} from "@/constant/design-constants";

interface Props {
  landlordId: number | undefined;
}

type VerificationStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "not verified"
  | null;

export default function LandlordPropertyMarquee({ landlordId }: Props) {
  const router = useRouter();
  const { properties, loading, fetchAllProperties } = usePropertyStore();
  const { subscription, loading: subscriptionLoading } =
    useSubscription(landlordId);

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(null);

  /* =========================
          FETCH PROPERTIES
    ========================== */
  useEffect(() => {
    if (landlordId) fetchAllProperties(landlordId);
  }, [landlordId, fetchAllProperties]);

  /* =========================
          FETCH VERIFICATION STATUS
    ========================== */
  useEffect(() => {
    if (!landlordId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/landlord/${landlordId}/profileStatus`);
        const data = await res.json();
        setVerificationStatus(data.status);
      } catch {
        setVerificationStatus("not verified");
      }
    };

    fetchStatus();
  }, [landlordId]);

  /* =========================
          DERIVED STATE
    ========================== */
  const isVerified = verificationStatus === "approved";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";

  const maxProperties = subscription?.limits?.maxProperties ?? null;
  const totalCount = properties?.length || 0;
  const isLimitReached = maxProperties !== null && totalCount >= maxProperties;

  const isAddDisabled = !isVerified || isLimitReached;

  /* =========================
          HANDLERS
    ========================== */
  const handleAddProperty = () => {
    if (!isVerified) {
      let title = "Account Not Verified";
      let message = "You must verify your account before adding properties.";
      let action = "Go to Verification";

      if (isPending) {
        title = "Verification Pending";
        message = "Your verification is currently under review.";
        action = "View Status";
      }

      if (isRejected) {
        title = "Verification Rejected";
        message = "Your verification was rejected. Please resubmit documents.";
        action = "Resubmit Verification";
      }

      Swal.fire({
        icon: "warning",
        title,
        html: `<p class="text-gray-600">${message}</p>`,
        confirmButtonText: action,
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
      }).then((res) => {
        if (res.isConfirmed) {
          router.push("/pages/landlord/verification");
        }
      });

      return;
    }

    if (isLimitReached) {
      Swal.fire({
        icon: "warning",
        title: "Property Limit Reached",
        html: `<p class="text-gray-600">
          You've reached your plan limit of <strong>${maxProperties}</strong> properties.
        </p>`,
        confirmButtonText: "Upgrade Plan",
        showCancelButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          router.push("/pages/landlord/subscription");
        }
      });

      return;
    }

    router.push("/pages/landlord/property-listing/create-property");
  };

  /* =========================
          LOADING STATE
    ========================== */
  if (loading || subscriptionLoading) {
    return (
      <div className={`${CARD_CONTAINER} h-[500px] animate-pulse`}>
        <div className={`${SECTION_HEADER} mb-4`}>
          <span className={GRADIENT_DOT} />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
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
      <div
        onClick={!isAddDisabled ? handleAddProperty : undefined}
        className={`${CARD_CONTAINER} ${!isAddDisabled ? CARD_HOVER : ""} 
                    h-[500px] flex flex-col items-center justify-center text-center
                    ${!isAddDisabled ? "cursor-pointer" : ""}`}
      >
        <div className={EMPTY_STATE_ICON}>
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>

        <h3 className={`${EMPTY_STATE_TITLE} mb-2`}>No Properties Yet</h3>

        <p className={`${EMPTY_STATE_DESC} mb-6 max-w-xs`}>
          Add your first property to start managing units and tenants.
        </p>

        <button
          onClick={handleAddProperty}
          disabled={isAddDisabled}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm
                        shadow-md hover:shadow-lg
                        transition-all duration-300
                        ${
                          isAddDisabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : `${GRADIENT_PRIMARY} text-white hover:scale-105 active:scale-95`
                        }`}
        >
          {!isVerified ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              Verify Account
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              Add Property
            </>
          )}
        </button>
      </div>
    );
  }

  /* =========================
          NORMAL STATE
    ========================== */
  const limitedProperties = properties.slice(0, 5);

  return (
    <div className={`${CARD_CONTAINER} ${CARD_HOVER} h-[500px] flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={SECTION_HEADER}>
          <span className={GRADIENT_DOT} />
          <h2 className={SECTION_TITLE}>Your Properties</h2>
        </div>

        {subscription && (
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full
                            ${
                              isLimitReached
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
          >
            {totalCount} / {maxProperties ?? "∞"}
          </span>
        )}
      </div>

      {/* Add Property Button */}
      <button
        onClick={handleAddProperty}
        disabled={isAddDisabled}
        className={`w-full flex items-center justify-center gap-2 
                    py-3 rounded-xl font-bold text-sm mb-3
                    shadow-md hover:shadow-lg
                    transition-all duration-300
                    ${
                      isAddDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : `${GRADIENT_PRIMARY} text-white hover:scale-[1.02] active:scale-95`
                    }`}
      >
        <PlusCircle className="w-4 h-4" />
        Add New Property
      </button>

      {/* Property List */}
      <div
        className={`flex-1 overflow-y-auto space-y-2 pr-2 ${CUSTOM_SCROLLBAR}`}
      >
        {limitedProperties.map((property) => (
          <div
            key={property.property_id}
            onClick={() =>
              router.push(`/pages/landlord/properties/${property.property_id}`)
            }
            className={`${ITEM_BASE} p-3 flex items-center gap-3 cursor-pointer
                            transition-all duration-200
                            hover:-translate-y-[1px] hover:shadow-md hover:ring-blue-200`}
          >
            {/* Property Image */}
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {property.photos?.[0]?.photo_url ? (
                <Image
                  src={property.photos[0].photo_url}
                  alt={property.property_name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Home className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate mb-1">
                {property.property_name}
              </h3>
              <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                {[property.street, property.city, property.province]
                  .filter(Boolean)
                  .join(", ") || "Address not specified"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      {properties.length > 5 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => router.push("/pages/landlord/property-listing")}
            className="w-full text-sm font-semibold text-blue-600 
                            py-2 rounded-lg
                            hover:bg-blue-50 transition-colors duration-200"
          >
            View All Properties ({properties.length}) →
          </button>
        </div>
      )}
    </div>
  );
}
