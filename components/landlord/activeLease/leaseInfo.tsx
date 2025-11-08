"use client";

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
    <div className="space-y-4">
      {/* TENANT INFORMATION */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            Tenant Information
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Name</p>
            <p className="text-sm font-medium text-gray-900">
              {lease.tenant_name || (
                <span className="italic text-gray-400">N/A</span>
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </p>
            {lease.email ? (
              <a
                href={`mailto:${lease.email}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium break-all"
              >
                {lease.email}
              </a>
            ) : (
              <span className="text-sm italic text-gray-400">N/A</span>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </p>
            {lease.phoneNumber ? (
              <a
                href={`tel:${lease.phoneNumber}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {lease.phoneNumber}
              </a>
            ) : (
              <span className="text-sm italic text-gray-400">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* LEASE OVERVIEW */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Lease Overview</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Property / Unit</p>
            <p className="text-sm font-medium text-gray-900">
              {lease.property_name} – {lease.unit_name}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Lease Period
            </p>
            <p className="text-sm text-gray-900">
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
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Agreement
            </p>
            {lease.agreement_url ? (
              <a
                href={lease.agreement_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Document
              </a>
            ) : (
              <span className="text-sm italic text-gray-400">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* FINANCIAL TERMS */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Financial Terms</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <p className="text-xs sm:text-sm text-gray-600">
                Security Deposit
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900">
              ₱{lease.security_deposit_amount?.toLocaleString() || "0.00"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <p className="text-xs sm:text-sm text-gray-600">
                Advance Payment
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900">
              ₱{lease.advance_payment_amount?.toLocaleString() || "0.00"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-xs sm:text-sm text-gray-600">
                Billing Due Day
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {lease.billing_due_day || "Not set"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-xs sm:text-sm text-gray-600">Grace Period</p>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {lease.grace_period_days || 0} days
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-500" />
              <p className="text-xs sm:text-sm text-gray-600">Late Penalty</p>
            </div>
            <span className="text-sm font-bold text-gray-900">
              ₱{lease.late_penalty_amount?.toLocaleString() || 0} /day
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-sm font-medium text-gray-900">Monthly Rent</p>
            </div>
            <span className="text-lg font-bold text-green-600">
              ₱{lease.rent_amount?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
