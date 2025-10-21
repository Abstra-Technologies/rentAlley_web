"use client";
import Image from "next/image";
import Link from "next/link";
import { EnvelopeIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import { HiOutlineBriefcase, HiOutlineCurrencyDollar, HiOutlineUser } from "react-icons/hi";
import { MapPinIcon, PhoneIcon, UserIcon } from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";

export default function CurrentTenant({ tenant, formatDate }) {
    if (!tenant)
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No tenant information available</p>
            </div>
        );

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 overflow-hidden shadow-md">
                        {tenant?.profilePicture ? (
                            <Image
                                src={tenant.profilePicture}
                                alt="Profile"
                                width={80}
                                height={80}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                <UserIcon className="h-8 w-8 text-gray-500" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                            {tenant.firstName} {tenant.lastName}
                        </h2>
                        {tenant.birthDate && (
                            <p className="text-gray-500 text-sm">Born: {formatDate(tenant.birthDate)}</p>
                        )}
                    </div>
                </div>

                {/* Tenant Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { icon: EnvelopeIcon, label: "Email", value: tenant.email },
                        { icon: PhoneIcon, label: "Phone", value: tenant.phoneNumber },
                        { icon: HiOutlineBriefcase, label: "Occupation", value: tenant.occupation },
                        { icon: HiOutlineUser, label: "Employment Type", value: tenant.employmentType },
                        { icon: HiOutlineCurrencyDollar, label: "Monthly Income", value: tenant.monthlyIncome },
                        { icon: MapPinIcon, label: "Address", value: tenant.address },
                    ].map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Icon className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        {item.label}
                                    </p>
                                    <p className="text-gray-800 font-medium break-words">
                                        {item.value || "Not provided"}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Valid ID */}
                {tenant?.validId && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mt-4 flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <IdentificationIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-blue-800 mb-1">Government ID</p>
                            <Link
                                href={tenant.validId}
                                target="_blank"
                                className="text-blue-600 hover:underline text-sm font-medium"
                            >
                                View Document
                            </Link>
                        </div>
                        <FaCheckCircle className="text-green-500 h-5 w-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
