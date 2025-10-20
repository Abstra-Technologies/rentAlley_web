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
        <Box className="space-y-6 mt-6">
            {/* Tenant Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    Tenant Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                    <p>
                        <span className="font-medium text-gray-600">Name:</span>{" "}
                        {lease.tenant_name || <span className="italic text-gray-400">N/A</span>}
                    </p>
                    <p>
            <span className="font-medium text-gray-600 flex items-center gap-1">
              <Mail className="w-4 h-4 text-blue-500" /> Email:
            </span>
                        {lease.email ? (
                            <a
                                href={`mailto:${lease.email}`}
                                className="text-blue-700 font-medium hover:underline ml-1"
                            >
                                {lease.email}
                            </a>
                        ) : (
                            <span className="italic text-gray-400 ml-1">N/A</span>
                        )}
                    </p>
                    <p>
            <span className="font-medium text-gray-600 flex items-center gap-1">
              <Phone className="w-4 h-4 text-emerald-600" /> Phone:
            </span>
                        {lease.phoneNumber ? (
                            <a
                                href={`tel:${lease.phoneNumber}`}
                                className="text-emerald-700 font-medium hover:underline ml-1"
                            >
                                {lease.phoneNumber}
                            </a>
                        ) : (
                            <span className="italic text-gray-400 ml-1">N/A</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Lease Overview Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-emerald-600" />
                    Lease Overview
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                    <p>
                        <span className="font-medium text-gray-600">Property / Unit:</span>{" "}
                        <span className="font-semibold">
              {lease.property_name} – {lease.unit_name}
            </span>
                    </p>
                    <p className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-600">Lease Period:</span>{" "}
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
                    <p className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-600">Agreement:</span>{" "}
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
                    </p>
                </div>
            </div>

            {/* Financial Terms Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Wallet className="w-5 h-5 text-amber-600" />
                    Financial Terms
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-gray-700">
                    <p className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-600">Security Deposit:</span>{" "}
                        <span className="font-semibold text-gray-800">
              ₱{lease.security_deposit_amount?.toLocaleString() || "0.00"}
            </span>
                    </p>

                    <p className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-600">Advance Payment:</span>{" "}
                        <span className="font-semibold text-gray-800">
              ₱{lease.advance_payment_amount?.toLocaleString() || "0.00"}
            </span>
                    </p>

                    <p className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-gray-600">Billing Due Day:</span>{" "}
                        <span className="font-semibold text-gray-800">
              {lease.billing_due_day || "Not set"}
            </span>
                    </p>

                    <p>
                        <span className="font-medium text-gray-600">Grace Period:</span>{" "}
                        <span className="font-semibold text-gray-800">
              {lease.grace_period_days || 0} days
            </span>
                    </p>

                    <p>
                        <span className="font-medium text-gray-600">Late Penalty:</span>{" "}
                        <span className="font-semibold text-gray-800">
              ₱{lease.late_penalty_amount?.toLocaleString() || 0} /day
            </span>
                    </p>

                    <p className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-600">Monthly Rent:</span>{" "}
                        <span className="text-lg font-bold text-green-700">
              ₱{lease.rent_amount?.toLocaleString() || 0}
            </span>
                    </p>
                </div>
            </div>
        </Box>
    );
}
