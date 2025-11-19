"use client";
import React from "react";
import Image from "next/image";
import {
  Building2,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Lock,
  Eye,
  Edit2,
  Trash2,
  Users,
  DollarSign,
} from "lucide-react";

const PropertyCard = ({
  property,
  index,
  subscription,
  totalProperties,
  handleView,
  handleEdit,
  handleDelete,
}: any) => {
  const maxProperties = subscription?.listingLimits?.maxProperties || 0;
  const isLockedByPlan =
    subscription &&
    totalProperties > maxProperties &&
    index + 1 > maxProperties;

  const isRejected = property?.verification_status === "Rejected";
  const isPending = property?.verification_status === "Pending";
  const isVerified = property?.verification_status === "Verified";

  const getStatusConfig = () => {
    if (isLockedByPlan)
      return {
        badge: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <Lock className="w-3 h-3" />,
        text: "Locked",
      };
    if (isRejected)
      return {
        badge: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle className="w-3 h-3" />,
        text: "Rejected",
      };
    if (isPending)
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="w-3 h-3" />,
        text: "Pending",
      };
    if (isVerified)
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle className="w-3 h-3" />,
        text: "Verified",
      };
    return {
      badge: "bg-gray-50 text-gray-600 border-gray-200",
      icon: <Clock className="w-3 h-3" />,
      text: "Unknown",
    };
  };

  const statusConfig = getStatusConfig();


  const totalUnits = property.total_units || 0;
  const occupiedUnits = property.occupied_units || 0;
  const totalIncome = property.total_income || 0;
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden ${
        isLockedByPlan ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Image Section */}
        <div className="relative flex-shrink-0 w-full sm:w-24 h-24 rounded-lg overflow-hidden">
          {property?.photos?.length ? (
            <Image
              src={property.photos[0].photo_url}
              alt={property.property_name || "Property image"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-1.5 left-1.5">
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border backdrop-blur-sm bg-white/95 ${statusConfig.badge}`}
            >
              {statusConfig.icon}
              <span>{statusConfig.text}</span>
            </div>
          </div>
        </div>

        {/* Property Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
            {property.property_name || "Unnamed Property"}
          </h3>
          <div className="flex items-start text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-1.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="line-clamp-1">
              {[property.street, property.city, property.province]
                .filter(Boolean)
                .join(", ") || "Address not specified"}
            </p>
          </div>
        </div>

        {/* Analytics*/}
        <div className="hidden md:flex items-center gap-8 mr-20">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-600">Occupancy</p>
              <p className="text-sm font-bold text-gray-900">
                {occupancyRate}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Total Income</p>
              <p className="text-sm font-bold text-gray-900">
                ₱{totalIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-1.5 flex-shrink-0 ml-10">
          <button
            onClick={(e) => handleView(property, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden lg:inline">View</span>
          </button>

          <button
            onClick={(e) => handleDelete(property.property_id, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden lg:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Mobile Analytics */}
      <div className="md:hidden flex items-center justify-around border-t border-gray-100 px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-xs text-gray-600">Occupancy</p>
            <p className="text-sm font-bold text-gray-900">{occupancyRate}%</p>
          </div>
        </div>

        <div className="w-px h-10 bg-gray-200"></div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Total Income</p>
            <p className="text-sm font-bold text-gray-900">
              ₱{totalIncome.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
