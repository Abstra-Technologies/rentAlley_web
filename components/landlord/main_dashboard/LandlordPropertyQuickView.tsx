"use client";

import { useEffect, useState } from "react";
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
import Swal from "sweetalert2";

import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";

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
                const res = await fetch(
                    `/api/landlord/${landlordId}/profileStatus`
                );
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
    const isLimitReached =
        maxProperties !== null && totalCount >= maxProperties;

    const isAddDisabled = !isVerified || isLimitReached;

    /* =========================
          HANDLERS
    ========================== */
    const handleAddProperty = () => {
        if (!isVerified) {
            let title = "Account Not Verified";
            let message =
                "You must verify your account before adding properties.";
            let action = "Go to Verification";

            if (isPending) {
                title = "Verification Pending";
                message = "Your verification is currently under review.";
                action = "View Status";
            }

            if (isRejected) {
                title = "Verification Rejected";
                message =
                    "Your verification was rejected. Please resubmit documents.";
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
          You’ve reached your plan limit of <strong>${maxProperties}</strong> properties.
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-[500px] shadow-sm ring-1 ring-gray-100 animate-pulse" />
        );
    }

    /* =========================
          EMPTY STATE (EMBOSSED)
    ========================== */
    if (!properties || properties.length === 0) {
        return (
            <div
                onClick={!isAddDisabled ? handleAddProperty : undefined}
                className={`bg-white rounded-xl border border-gray-200 p-6 h-[500px]
        flex flex-col items-center justify-center text-center
        shadow-sm ring-1 ring-gray-100
        transition-all duration-300
        ${
                    !isAddDisabled
                        ? "cursor-pointer hover:-translate-y-[2px] hover:shadow-2xl hover:ring-blue-200"
                        : ""
                }`}
            >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <Building2 className="w-8 h-8 text-blue-600" />
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-2">
                    No Properties Yet
                </h3>

                <p className="text-sm text-gray-600 mb-4 max-w-xs">
                    Add your first property to start managing units and tenants.
                </p>

                <button
                    disabled={isAddDisabled}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm
          transition-all duration-300
          ${
                        isAddDisabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 hover:scale-105 text-white shadow-md"
                    }`}
                >
                    {!isVerified ? (
                        <>
                            <AlertTriangle className="w-4 h-4" />
                            Verify Account
                        </>
                    ) : (
                        <>
                            <PlusCircle className="w-4 h-4" />
                            Add Property
                        </>
                    )}
                </button>
            </div>
        );
    }

    /* =========================
          NORMAL STATE (EMBOSSED)
    ========================== */
    const limitedProperties = properties.slice(0, 5);

    return (
        <div
            className="bg-white rounded-xl border border-gray-200 p-4 h-[500px]
      flex flex-col space-y-3
      shadow-sm ring-1 ring-gray-100
      transition-all duration-300
      hover:-translate-y-[2px] hover:shadow-xl hover:ring-blue-200"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                    Your Properties
                </h2>

                {subscription && (
                    <span
                        className={`text-xs font-semibold px-2 py-1 rounded-md border
            ${
                            isLimitReached
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
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
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm
        transition-all duration-300
        ${
                    isAddDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 hover:scale-[1.02] text-white shadow-sm"
                }`}
            >
                <PlusCircle className="w-4 h-4" />
                Add New Property
            </button>

            {/* Property List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {limitedProperties.map((property) => (
                    <div
                        key={property.property_id}
                        onClick={() =>
                            router.push(
                                `/pages/landlord/properties/${property.property_id}`
                            )
                        }
                        className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
            shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]
            transition-all duration-200
            hover:bg-gray-50 hover:shadow-md hover:ring-1 hover:ring-blue-100"
                    >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                            {property.photos?.[0]?.photo_url ? (
                                <Image
                                    src={property.photos[0].photo_url}
                                    alt={property.property_name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Home className="w-6 h-6" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {property.property_name}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-blue-600" />
                                {[property.street, property.city, property.province]
                                    .filter(Boolean)
                                    .join(", ") || "Address not specified"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {properties.length > 5 && (
                <button
                    onClick={() => router.push("/pages/landlord/property-listing")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 py-2"
                >
                    View All Properties ({properties.length}) →
                </button>
            )}
        </div>
    );
}
