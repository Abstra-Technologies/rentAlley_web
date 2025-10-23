"use client";

import { Box } from "@mui/material";
import {
    User,
    Mail,
    Phone,
    Home,
    FileText,
    Calendar,
    Wallet,
    DollarSign,
    Clock,
    Shield,
} from "lucide-react";

interface LeaseDetails {
    tenant_name?: string;
    email?: string;
    phoneNumber?: string;
    property_name?: string;
    unit_name?: string;
    start_date?: string;
    end_date?: string;
    agreement_url?: string;
    security_deposit_amount?: number;
    advance_payment_amount?: number;
    billing_due_day?: number;
    grace_period_days?: number;
    late_penalty_amount?: number;
    rent_amount?: number;
}

interface LeaseInfoProps {
    lease: LeaseDetails;
}

export default function LeaseInfo({ lease }: LeaseInfoProps) {
    return (
        <Box className="mt-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
            {/* ======= GRID CONTAINER ======= */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* TENANT INFORMATION */}
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-blue-600" />
                        Tenant Information
                    </h3>

                    <div className="space-y-3 text-gray-700 text-sm sm:text-base">
                        <div>
                            <p className="font-medium text-gray-600">Name</p>
                            <p className="font-semibold text-gray-800">
                                {lease.tenant_name || <span className="italic text-gray-400">N/A</span>}
                            </p>
                        </div>

                        <div>
                            <p className="font-medium text-gray-600 flex items-center gap-1">
                                <Mail className="w-4 h-4 text-blue-500" /> Email
                            </p>
                            {lease.email ? (
                                <a
                                    href={`mailto:${lease.email}`}
                                    className="text-blue-700 font-medium hover:underline break-all"
                                >
                                    {lease.email}
                                </a>
                            ) : (
                                <span className="italic text-gray-400">N/A</span>
                            )}
                        </div>

                        <div>
                            <p className="font-medium text-gray-600 flex items-center gap-1">
                                <Phone className="w-4 h-4 text-emerald-600" /> Phone
                            </p>
                            {lease.phoneNumber ? (
                                <a
                                    href={`tel:${lease.phoneNumber}`}
                                    className="text-emerald-700 font-medium hover:underline"
                                >
                                    {lease.phoneNumber}
                                </a>
                            ) : (
                                <span className="italic text-gray-400">N/A</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* LEASE OVERVIEW */}
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <Home className="w-5 h-5 text-emerald-600" />
                        Lease Overview
                    </h3>

                    <div className="space-y-3 text-gray-700 text-sm sm:text-base">
                        <div>
                            <p className="font-medium text-gray-600">Property / Unit</p>
                            <p className="font-semibold text-gray-800">
                                {lease.property_name} – {lease.unit_name}
                            </p>
                        </div>

                        <div>
                            <p className="font-medium text-gray-600 flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-blue-500" /> Lease Period
                            </p>
                            <p>
                                {lease.start_date
                                    ? new Date(lease.start_date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })
                                    : "N/A"}{" "}
                                →{" "}
                                {lease.end_date
                                    ? new Date(lease.end_date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })
                                    : "N/A"}
                            </p>
                        </div>

                        <div>
                            <p className="font-medium text-gray-600 flex items-center gap-1">
                                <FileText className="w-4 h-4 text-blue-600" /> Agreement
                            </p>
                            {lease.agreement_url ? (
                                <a
                                    href={lease.agreement_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 font-medium hover:underline"
                                >
                                    View Document
                                </a>
                            ) : (
                                <span className="italic text-gray-400">N/A</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* FINANCIAL TERMS */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <Wallet className="w-5 h-5 text-amber-600" />
                        Financial Terms
                    </h3>

                    <div className="space-y-3 text-gray-700 text-sm sm:text-base">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-600" />
                                <p className="font-medium text-gray-600">Security Deposit</p>
                            </div>
                            <span className="font-semibold text-gray-800">
                ₱{lease.security_deposit_amount?.toLocaleString() || "0.00"}
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-500" />
                                <p className="font-medium text-gray-600">Advance Payment</p>
                            </div>
                            <span className="font-semibold text-gray-800">
                ₱{lease.advance_payment_amount?.toLocaleString() || "0.00"}
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <p className="font-medium text-gray-600">Billing Due Day</p>
                            </div>
                            <span className="font-semibold text-gray-800">
                {lease.billing_due_day || "Not set"}
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <p className="font-medium text-gray-600">Grace Period</p>
                            </div>
                            <span className="font-semibold text-gray-800">
                {lease.grace_period_days || 0} days
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-red-500" />
                                <p className="font-medium text-gray-600">Late Penalty</p>
                            </div>
                            <span className="font-semibold text-gray-800">
                ₱{lease.late_penalty_amount?.toLocaleString() || 0} /day
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <p className="font-medium text-gray-600">Monthly Rent</p>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-green-700">
                ₱{lease.rent_amount?.toLocaleString() || 0}
              </span>
                        </div>
                    </div>
                </div>
            </div>
        </Box>
    );
}
