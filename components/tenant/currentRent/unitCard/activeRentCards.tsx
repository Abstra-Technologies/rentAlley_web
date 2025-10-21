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

  if (bothZero || (isSecurityPaid && isAdvancePaid) ) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-700 rounded-full text-xs font-semibold shadow-md border border-gray-200">
        <CheckCircleIcon className="w-3.5 h-3.5 text-gray-600" />
        <span>Unit Activated</span>
      </div>
    );
  }

//   if (isSecurityPaid && isAdvancePaid) {
//     return (
//       <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full text-xs font-semibold shadow-md">
//         <CheckCircleIcon className="w-3.5 h-3.5" />
//         <span>Paid</span>
//       </div>
//     );
//   }

  if (hasPendingProof) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full text-xs font-semibold shadow-md">
        <ClockIcon className="w-3.5 h-3.5" />
        <span>Pending</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full text-xs font-semibold shadow-md animate-pulse">
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
    <article className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-emerald-200 overflow-hidden group">
      {/* Image Section */}
      <div className="relative h-48 sm:h-52 overflow-hidden">
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
          <div className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-emerald-50 flex items-center justify-center">
            <PhotoIcon className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Payment Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <PaymentStatusBadge unit={unit} />
        </div>

        {/* Due Date Banner */}
        {unit.due_date && unit.due_day && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600/95 to-emerald-600/95 backdrop-blur-md text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="flex items-center gap-1">
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
            <span className="font-bold sm:text-right">
              Next: {formatDate(unit.due_date)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg">
              <HomeIcon className="w-5 h-5 text-emerald-600" />
            </div>
            Unit {unit.unit_name}
          </h2>

          <div className="flex items-start text-gray-600 mb-3">
            <MapPinIcon className="w-4 h-4 mr-1.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm line-clamp-2">
              {unit.property_name} · {unit.city}, {unit.province}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-700">
                {formatCurrency(unit.rent_amount)}/mo
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <FaHome className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-emerald-700">
                {unit.unit_size} sqm
              </span>
            </div>
          </div>
        </div>

        {/* Lease Period */}
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-gray-800">
              Lease Period
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium">
            {formatDate(unit.start_date)} → {formatDate(unit.end_date)}
            {isLeaseExpired && (
              <span className="block sm:inline sm:ml-2 text-red-600 font-bold mt-1 sm:mt-0">
                (Expired)
              </span>
            )}
          </p>
        </div>

        {/* Payment Details */}
        {!isPaymentsComplete && !bothZero && !isLeaseExpired && (
          <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
            <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              Initial Payments Due
            </h4>
            <div className="space-y-2 text-sm">
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
              <div className="flex justify-between items-center pt-2 border-t-2 border-red-300">
                <span className="font-bold text-gray-800">Total Due:</span>
                <span className="font-bold text-red-800 text-base">
                  {formatCurrency(totalPaymentDue)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Access Portal - Always Visible */}
          <button
            onClick={() => onAccessPortal(unit.agreement_id)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <HomeIcon className="w-5 h-5" />
            Access Portal
          </button>

          {/* Expired Lease Actions */}
          {isLeaseExpired && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onRenewLease(unit.unit_id, unit.agreement_id)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Renew</span>
              </button>

              <button
                onClick={() => onEndContract(unit.unit_id, unit.agreement_id)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>End</span>
              </button>
            </div>
          )}

          {/* Pending Proof Message */}
          {unit.has_pending_proof && !isLeaseExpired && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
              <div className="flex items-start gap-2 text-amber-800">
                <ClockIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-semibold">
                  Proof submitted. Awaiting landlord confirmation.
                </span>
              </div>
            </div>
          )}

          {/* Payment Actions */}
          {showPayButton && !isLeaseExpired && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => onPayment(unit.unit_id)}
                disabled={loadingPayment}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loadingPayment ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaCreditCard className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Pay via Maya</span>
                <span className="sm:hidden">Pay Now</span>
              </button>

              <button
                onClick={() =>
                  onUploadProof(
                    unit.unit_id,
                    unit.agreement_id,
                    totalPaymentDue
                  )
                }
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <FaUpload className="w-4 h-4" />
                <span>Upload Proof</span>
              </button>
            </div>
          )}

          {/* Message Landlord */}
          <button
            onClick={onContactLandlord}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FaComments className="w-5 h-5" />
            Message Landlord
          </button>
        </div>
      </div>
    </article>
  );
}
