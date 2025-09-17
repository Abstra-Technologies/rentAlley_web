

"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    BuildingOffice2Icon,
    HomeIcon,
    PencilSquareIcon,
    TrashIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import XCircleIcon from "@heroicons/react/24/solid/XCircleIcon";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import ExclamationTriangleIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";

interface PropertyCardProps {
    property: any;
    index: number;
    subscription: any;
    handleView: (property: any, event: React.MouseEvent) => void;
    handleEdit: (propertyId: number, event: React.MouseEvent) => void;
    handleDelete: (propertyId: number, event: React.MouseEvent) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
                                                       property,
                                                       index,
                                                       subscription,
                                                       handleView,
                                                       handleEdit,
                                                       handleDelete,
                                                   }) => {
    const router = useRouter();

    const isLockedByPlan =
        subscription && index >= (subscription?.listingLimits?.maxProperties || 0);
    const isRejected = property?.verification_status === "Rejected";

    return (
        <div
            key={property?.property_id}
            className={`relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow h-full flex flex-col hover:shadow-md`}
        >
            {/* 🔒 Locked by subscription (full overlay) */}
            {isLockedByPlan && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex flex-col items-center justify-center text-gray-500 font-semibold z-20">
                    <p className="text-red-600 font-bold">Locked - Upgrade Plan</p>
                    <Link
                        href="/pages/landlord/sub_two/subscription"
                        className="mt-2 text-blue-600 underline text-sm"
                    >
                        Upgrade Subscription
                    </Link>
                </div>
            )}

            {/* 🔴 Rejected Overlay (semi-transparent but card visible) */}
            {isRejected && (
                <div className="absolute inset-0 bg-red-50 bg-opacity-70 flex items-center justify-center z-20 p-4 pointer-events-none">
                    <div className="pointer-events-auto bg-white shadow-lg rounded-lg p-4 flex flex-col items-center space-y-3 w-11/12 sm:w-4/5 lg:w-2/3">
                        {/* Warning Title */}
                        <p className="font-semibold text-red-700 text-sm uppercase tracking-wide flex items-center space-x-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                            <span>Verification Rejected</span>
                        </p>

                        {/* Action Buttons */}
                        {property?.attempts < 4 ? (
                            <button
                                className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-xs font-medium bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                                onClick={() =>
                                    router.push(
                                        `/pages/landlord/property-listing/resubmit-verification/${property?.property_id}`
                                    )
                                }
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                <span>Resubmit ({4 - property.attempts} left)</span>
                            </button>
                        ) : (
                            <span className="w-full px-4 py-2 text-xs font-medium bg-red-200 text-red-800 rounded-md text-center flex items-center justify-center space-x-2">
          <XCircleIcon className="h-4 w-4" />
          <span>Max attempts reached</span>
        </span>
                        )}

                        {/* Divider */}
                        <div className="w-full border-t border-gray-200"></div>

                        {/* Delete Button */}
                        <button
                            className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-xs font-medium text-red-600 border border-red-400 rounded-md hover:bg-red-50 transition"
                            onClick={(event) => handleDelete(property?.property_id, event)}
                        >
                            <TrashIcon className="h-4 w-4" />
                            <span>Delete Property</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Property Image */}
            <div className="h-48">
                {property?.photos.length > 0 ? (
                    <Image
                        src={property?.photos[0]?.photo_url}
                        alt={property?.property_name}
                        width={400}
                        height={250}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <BuildingOffice2Icon className="h-12 w-12 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Property Info */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-2 flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                        {property?.property_name}
                    </h3>
                    <div className="flex items-start text-gray-600 text-sm mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-2">
                            {property?.street}, {property?.city},{" "}
                            {property?.province
                                .split("_")
                                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                        </p>
                    </div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            {property?.property_type.charAt(0).toUpperCase() +
                property?.property_type.slice(1)}
          </span>
                </div>


                <span
                    className={`
inline-block px-3 py-1 text-xs font-semibold rounded-full 
    ${
                        property?.verification_status === "Verified"
                            ? "bg-green-100 text-green-700"
                            : property?.verification_status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : property?.verification_status === "Pending"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-600"
                    }
  `}
                >
  {property?.verification_status}
</span>


                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex justify-between">
                        {/* View disabled if rejected */}
                        <button
                            className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                isRejected || isLockedByPlan
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                            onClick={(event) => handleView(property, event)}
                            disabled={isRejected || isLockedByPlan}
                        >
                            <HomeIcon className="h-4 w-4 mr-1" />
                            View Units
                        </button>

                        <div className="flex space-x-2">
                            {/* Edit disabled if rejected */}
                            <button
                                className={`p-2 rounded-full transition-colors ${
                                    isRejected || isLockedByPlan
                                        ? "text-gray-400 cursor-not-allowed bg-gray-100"
                                        : "text-orange-500 hover:bg-orange-50"
                                }`}
                                onClick={
                                    !isRejected && !isLockedByPlan
                                        ? (event) => handleEdit(property?.property_id, event)
                                        : undefined
                                }
                                disabled={isRejected || isLockedByPlan}
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>

                            {/* 🟢 Delete is always available */}
                            <button
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                onClick={(event) => handleDelete(property?.property_id, event)}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
