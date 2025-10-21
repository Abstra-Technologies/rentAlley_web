"use client";

import Image from "next/image";
import {
  HomeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  FaHome,
  FaCreditCard,
  FaUpload,
  FaComments,
  FaSpinner,
} from "react-icons/fa";
import { RefreshCw, XCircle } from "lucide-react";

import {
  formatCurrency,
  formatDate,
  toNumber,
} from "@/utils/formatter/formatters";
import { Unit } from "@/types/units";

// --- Payment Status Badge ---
const PaymentStatusBadge = ({ unit }: { unit: Unit }) => {
  const isSecurityPaid = unit.is_security_deposit_paid;
  const isAdvancePaid = unit.is_advance_payment_paid;
  const hasPendingProof = unit.has_pending_proof;

  const bothZero =
    toNumber(unit.sec_deposit) === 0 && toNumber(unit.advanced_payment) === 0;

  if (bothZero || (isSecurityPaid && isAdvancePaid)) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-semibold shadow-lg">
        <CheckCircleIcon className="w-3.5 h-3.5" />
        <span>Activated</span>
      </div>
    );
  }

  if (hasPendingProof) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-semibold shadow-lg">
        <ClockIcon className="w-3.5 h-3.5" />
        <span>Pending Verification</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-full text-xs font-semibold shadow-lg animate-pulse">
      <ExclamationTriangleIcon className="w-3.5 h-3.5" />
      <span>Payment Due</span>
    </div>
  );
};

// --- UnitCard Component ---
export default function UnitCard({
  unit,
  onPayment,
  onUploadProof,
  onContactLandlord,
  onAccessPortal,
  onRenewLease,
  onEndContract,
  loadingPayment,
}: {
  unit: Unit;
  onPayment: (unitId: string) => void;
  onUploadProof: (unitId: string, agreementId: string, amount: number) => void;
  onContactLandlord: () => void;
  onAccessPortal: (agreementId: string) => void;
  onRenewLease: (unitId: string, agreementId: string) => void;
  onEndContract: (unitId: string, agreementId: string) => void;
  loadingPayment: boolean;
}) {
  const isPaymentsComplete =
    unit.is_advance_payment_paid && unit.is_security_deposit_paid;

  const bothZero =
    toNumber(unit.sec_deposit) === 0 && toNumber(unit.advanced_payment) === 0;

  const totalPaymentDue =
    toNumber(!unit.is_security_deposit_paid ? unit.sec_deposit : 0) +
    toNumber(!unit.is_advance_payment_paid ? unit.advanced_payment : 0);

  const showPayButton =
    !isPaymentsComplete && !unit.has_pending_proof && !bothZero;

  const isLeaseExpired = new Date(unit.end_date) < new Date();

  return (
    <article className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-300 overflow-hidden group flex flex-col h-full">
      {/* Image Section with Status Badge */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
        {unit.unit_photos?.[0] ? (
          <Image
            src={unit.unit_photos[0]}
            alt={`Unit ${unit.unit_name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-emerald-100 flex items-center justify-center">
            <PhotoIcon className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* Payment Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <PaymentStatusBadge unit={unit} />
        </div>

        {/* Lease Status Indicator */}
        {isLeaseExpired && (
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
            Expired
          </div>
        )}

        {/* Billing Info Banner */}
        {unit.due_date && unit.due_day && !isLeaseExpired && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600/90 to-emerald-600/90 backdrop-blur-sm text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span>
                  Billing: <span className="font-bold">{unit.due_day}</span>
                  {unit.due_day === 1
                    ? "st"
                    : unit.due_day === 2
                    ? "nd"
                    : unit.due_day === 3
                    ? "rd"
                    : "th"}
                </span>
              </span>
              <span className="font-bold">
                Next: {formatDate(unit.due_date)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex-shrink-0">
              <HomeIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Unit {unit.unit_name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {unit.property_name}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-1.5 text-gray-600 mb-3">
            <MapPinIcon className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm line-clamp-2">
              {unit.city}, {unit.province}
            </p>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <CurrencyDollarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-blue-700 text-xs sm:text-sm">
                {formatCurrency(unit.rent_amount)}/mo
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <FaHome className="w-3 h-3 text-emerald-600" />
              <span className="font-semibold text-emerald-700 text-xs sm:text-sm">
                {unit.unit_size} sqm
              </span>
            </div>
          </div>
        </div>

        {/* Lease Period Info */}
        <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-900">
              Lease Period
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 font-medium">
            {formatDate(unit.start_date)} → {formatDate(unit.end_date)}
            {isLeaseExpired && (
              <span className="block text-rose-600 font-bold mt-1">
                (Lease Expired)
              </span>
            )}
          </p>
        </div>

        {/* Payment Due Alert */}
        {!isPaymentsComplete && !bothZero && !isLeaseExpired && (
          <div className="mb-4 p-3 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl border border-red-200">
            <h4 className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1.5">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Initial Payments Required
            </h4>
            <div className="space-y-1.5 text-xs">
              {!unit.is_security_deposit_paid && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Security Deposit:</span>
                  <span className="font-bold text-red-700">
                    {formatCurrency(unit.sec_deposit)}
                  </span>
                </div>
              )}
              {!unit.is_advance_payment_paid && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Advance Payment:</span>
                  <span className="font-bold text-red-700">
                    {formatCurrency(unit.advanced_payment)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-red-200 font-bold">
                <span className="text-gray-900">Total Due:</span>
                <span className="text-red-900">
                  {formatCurrency(totalPaymentDue)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Verification Message */}
        {unit.has_pending_proof && !isLeaseExpired && (
          <div className="mb-4 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-2 text-amber-800">
              <ClockIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm font-semibold">
                Payment proof submitted. Awaiting landlord verification.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons - Flex-grow to push to bottom */}
        <div className="mt-auto space-y-2">
          {/* Primary Action: Access Portal */}
          <button
            onClick={() => onAccessPortal(unit.agreement_id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Access Portal</span>
          </button>

          {/* Expired Lease Actions */}
          {isLeaseExpired && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onRenewLease(unit.unit_id, unit.agreement_id)}
                className="flex items-center justify-center gap-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renew</span>
              </button>
              <button
                onClick={() => onEndContract(unit.unit_id, unit.agreement_id)}
                className="flex items-center justify-center gap-1 py-2 px-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>End Lease</span>
              </button>
            </div>
          )}

          {/* Payment Actions */}
          {showPayButton && !isLeaseExpired && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onPayment(unit.unit_id)}
                disabled={loadingPayment}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loadingPayment ? (
                  <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FaCreditCard className="w-3.5 h-3.5" />
                )}
                <span>Pay</span>
              </button>
              <button
                onClick={() =>
                  onUploadProof(
                    unit.unit_id,
                    unit.agreement_id,
                    totalPaymentDue
                  )
                }
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <FaUpload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>
          )}

          {/* Message Landlord */}
          <button
            onClick={onContactLandlord}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FaComments className="w-4 h-4" />
            <span>Message Landlord</span>
          </button>
        </div>
      </div>
    </article>
  );
}
