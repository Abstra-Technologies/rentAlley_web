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
    LockClosedIcon,
    UsersIcon,
    BanknotesIcon,
} from "@heroicons/react/24/outline";

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
        subscription && totalProperties > maxProperties && index + 1 > maxProperties;

    const isRejected = property?.verification_status === "Rejected";
    const isPending = property?.verification_status === "Pending";
    const isVerified = property?.verification_status === "Verified";

    const getStatusConfig = () => {
        if (isLockedByPlan)
            return {
                badge: "bg-gray-200 text-gray-700",
                icon: <LockClosedIcon className="w-4 h-4" />,
                text: "Locked",
            };
        if (isRejected)
            return {
                badge: "bg-red-100 text-red-700",
                icon: <XCircleIcon className="w-4 h-4" />,
                text: "Rejected",
            };
        if (isPending)
            return {
                badge: "bg-yellow-100 text-yellow-700",
                icon: <ClockIcon className="w-4 h-4" />,
                text: "Pending",
            };
        if (isVerified)
            return {
                badge: "bg-green-100 text-green-700",
                icon: <CheckCircleIcon className="w-4 h-4" />,
                text: "Verified",
            };
        return {
            badge: "bg-gray-100 text-gray-600",
            icon: <ClockIcon className="w-4 h-4" />,
            text: "Unknown",
        };
    };

    const statusConfig = getStatusConfig();

    const totalIncome = property.total_income || 0;

    const totalUnits = property.total_units;
    const occupiedUnits = property.occupied_units;

// compute occupancy ONLY if backend provided numbers
    let occupancyRate = 0;

    if (typeof totalUnits === "number" && totalUnits > 0) {
        occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);
    }


    return (
        <div
            className={`flex flex-col sm:flex-row items-center gap-3 w-full bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 p-3 ${
                isLockedByPlan ? "opacity-70 pointer-events-none" : ""
            }`}
        >
            {/* 📸 Compact Image */}
            <div className="relative flex-shrink-0 w-full sm:w-28 h-24 overflow-hidden rounded-md">
                {property?.photos?.length ? (
                    <Image
                        src={property.photos[0].photo_url}
                        alt={property.property_name || "Property image"}
                        width={300}
                        height={200}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
                    </div>
                )}
                {/* Badge */}
                <div className="absolute top-1.5 right-1.5">
                    <div
                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig.badge}`}
                    >
                        {statusConfig.icon}
                        <span>{statusConfig.text}</span>
                    </div>
                </div>
            </div>

            {/* 🏠 Main Content Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                {/* Property Info */}
                <div className="flex-1 min-w-[180px]">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">
                        {property.property_name || "Unnamed Property"}
                    </h3>
                    <div className="flex items-start text-gray-600 text-xs mt-0.5">
                        <MapPinIcon className="h-3.5 w-3.5 mr-1 text-blue-500 flex-shrink-0" />
                        <p className="line-clamp-1">
                            {[property.street, property.city, property.province]
                                .filter(Boolean)
                                .join(", ") || "Address not specified"}
                        </p>
                    </div>
                </div>

                {/* 📊 Analytics - evenly spread, inline */}
                <div className="flex flex-1 justify-evenly sm:justify-around text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                        <UsersIcon className="h-4 w-4 text-emerald-600" />
                        <div>
                            <p className="text-gray-500 font-medium leading-tight">
                                Occupancy
                            </p>
                            <p className="font-semibold text-gray-800 leading-tight">
                                {occupancyRate}%
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <BanknotesIcon className="h-4 w-4 text-blue-600" />
                        <div>
                            <p className="text-gray-500 font-medium leading-tight">
                                Total Income
                            </p>
                            <p className="font-semibold text-gray-800 leading-tight">
                                ₱{totalIncome.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ⚙️ Action Buttons */}
                <div className="flex flex-wrap gap-1.5 justify-end">
                    <button
                        onClick={(e) => handleView(property, e)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gradient-to-r from-blue-500 to-emerald-500 text-white hover:from-blue-600 hover:to-emerald-600"
                    >
                        <HomeIcon className="w-3.5 h-3.5" />
                        View
                    </button>
                    <button
                        onClick={(e) => handleEdit(property.property_id, e)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                    >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        Edit
                    </button>
                    <button
                        onClick={(e) => handleDelete(property.property_id, e)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
