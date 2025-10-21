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
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface PropertyCardProps {
  property: any;
  index: number;
  subscription: any;
  totalProperties: number;
  handleView: (property: any, event: React.MouseEvent) => void;
  handleEdit: (propertyId: number, event: React.MouseEvent) => void;
  handleDelete: (propertyId: number, event: React.MouseEvent) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
                                                     property,
                                                     index,
                                                     subscription,
                                                     totalProperties,
                                                     handleView,
                                                     handleEdit,
                                                     handleDelete,
                                                   }) => {
  const router = useRouter();

  const maxProperties = subscription?.listingLimits?.maxProperties || 0;

  const isLockedByPlan =
      subscription &&
      totalProperties > maxProperties &&
      index + 1 > maxProperties;


  const isRejected = property?.verification_status === "Rejected";
  const isPending = property?.verification_status === "Pending";
  const isVerified = property?.verification_status === "Verified";

  const getStatusConfig = () => {
    if (isLockedByPlan) {
      return {
        color: "bg-gray-100 border-gray-300",
        badge: "bg-gray-200 text-gray-700",
        icon: <LockClosedIcon className="w-4 h-4" />,
        text: "Locked",
      };
    }
    if (isRejected) {
      return {
        color: "bg-red-50 border-red-200",
        badge: "bg-red-100 text-red-700",
        icon: <XCircleIcon className="w-4 h-4" />,
        text: "Rejected",
      };
    }
    if (isPending) {
      return {
        color: "bg-yellow-50 border-yellow-200",
        badge: "bg-yellow-100 text-yellow-700",
        icon: <ClockIcon className="w-4 h-4" />,
        text: "Pending",
      };
    }
    if (isVerified) {
      return {
        color: "bg-white border-gray-200 hover:border-blue-300",
        badge: "bg-green-100 text-green-700",
        icon: <CheckCircleIcon className="w-4 h-4" />,
        text: "Verified",
      };
    }
    return {
      color: "bg-white border-gray-200",
      badge: "bg-gray-100 text-gray-600",
      icon: <ClockIcon className="w-4 h-4" />,
      text: "Unknown",
    };
  };

  const statusConfig = getStatusConfig();

  return (
      <div
          className={`relative rounded-xl sm:rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl ${
              statusConfig.color
          } ${isLockedByPlan ? "opacity-70 pointer-events-none" : ""}`}
      >
        {/* Property Image */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          {property?.photos?.length ? (
              <Image
                  src={property.photos[0].photo_url}
                  alt={property?.property_name || "Property image"}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
          ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <BuildingOffice2Icon className="h-16 w-16 text-gray-400" />
              </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg ${statusConfig.badge}`}
            >
              {statusConfig.icon}
              <span>{statusConfig.text}</span>
            </div>
          </div>

          {/* Locked Overlay */}
          {isLockedByPlan && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-4 text-center shadow-xl max-w-xs mx-4">
                  <LockClosedIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-800 mb-1">
                    Property Limit Reached
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Unlock this property by upgrading your plan.
                  </p>
                  <Link
                      href="/pages/landlord/subscription_plan/pricing"
                      className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200"
                  >
                    Upgrade Plan
                  </Link>
                </div>
              </div>
          )}
        </div>

        {/* Property Details */}
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-1">
            {property?.property_name || "Unnamed Property"}
          </h3>

          <div className="flex items-start text-gray-600 text-sm mb-3">
            <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-blue-500" />
            <p className="line-clamp-2 leading-relaxed">
              {[
                property?.street,
                property?.city,
                property?.province
                    ?.split("_")
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" "),
              ]
                  .filter(Boolean)
                  .join(", ") || "Address not specified"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between space-x-3">
            <button
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isRejected || isLockedByPlan
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg"
                }`}
                onClick={
                  !isRejected && !isLockedByPlan
                      ? (event) => handleView(property, event)
                      : undefined
                }
                disabled={isRejected || isLockedByPlan}
            >
              <HomeIcon className="w-4 h-4" />
              <span className="text-sm">View Units</span>
            </button>

            <button
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                    isRejected || isLockedByPlan
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                }`}
                onClick={
                  !isRejected && !isLockedByPlan
                      ? (event) => handleEdit(property?.property_id, event)
                      : undefined
                }
                disabled={isRejected || isLockedByPlan}
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>

            <button
                className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-all duration-200"
                onClick={(event) => handleDelete(property?.property_id, event)}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
  );
};

export default PropertyCard;
