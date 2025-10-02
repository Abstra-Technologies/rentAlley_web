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
import { FaHome, FaCreditCard, FaUpload, FaComments, FaSpinner } from "react-icons/fa";

import { formatCurrency, formatDate, toNumber } from "@/utils/formatter/formatters";
import { Unit } from "@/types/units";

// --- Payment Status Badge for Sec and Adv ---
const PaymentStatusBadge = ({ unit }: { unit: Unit }) => {
    const isSecurityPaid = unit.is_security_deposit_paid;
    const isAdvancePaid = unit.is_advance_payment_paid;
    const hasPendingProof = unit.has_pending_proof;

    const bothZero =
        toNumber(unit.sec_deposit) === 0 && toNumber(unit.advanced_payment) === 0;

    if (bothZero) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm">
                <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                <span className="font-medium">No Sec/Adv Payment Required</span>
            </div>
        );
    }

    if (isSecurityPaid && isAdvancePaid) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 rounded-full text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="font-medium">Sec/Adv Payments Complete</span>
            </div>
        );
    }

    if (hasPendingProof) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 rounded-full text-sm">
                <ClockIcon className="w-4 h-4" />
                <span className="font-medium">Sec/Adv Payment Pending Confirmation</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-full text-sm">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="font-medium">Sec/Adv Payment Required</span>
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
                                     loadingPayment,
                                 }: {
    unit: Unit;
    onPayment: (unitId: string) => void;
    onUploadProof: (unitId: string, agreementId: string, amount: number) => void;
    onContactLandlord: () => void;
    onAccessPortal: (agreementId: string) => void;
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

    return (
        <article className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
            {/* Image Section */}
            <div className="relative h-48 sm:h-56">
                {unit.unit_photos?.[0] ? (
                    <Image
                        src={unit.unit_photos[0]}
                        alt={`Unit ${unit.unit_name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={false}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400" />
                    </div>
                )}

                {/* Payment Status Overlay */}
                <div className="absolute top-3 left-3">
                    <PaymentStatusBadge unit={unit} />
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <HomeIcon className="w-5 h-5 text-emerald-600" />
                            Unit {unit.unit_name}
                        </h2>
                    </div>

                    <div className="flex items-center text-gray-600 mb-2">
                        <MapPinIcon className="w-4 h-4 mr-1.5 text-emerald-500" />
                        <p className="text-sm truncate">
                            {unit.property_name} · {unit.city}, {unit.province}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold">
                {formatCurrency(unit.rent_amount)}/month
              </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaHome className="w-3 h-3 text-emerald-500" />
                            <span>{unit.unit_size} sqm</span>
                        </div>
                    </div>
                </div>

                {/* Lease Period */}
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
              Lease Period
            </span>
                    </div>
                    <p className="text-sm text-gray-600">
                        {formatDate(unit.start_date)} - {formatDate(unit.end_date)}
                    </p>
                </div>

                {/* Payment Details */}
                {!isPaymentsComplete && !bothZero && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
                        <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            Initial Payments
                        </h4>
                        <div className="space-y-1 text-sm">
                            {!unit.is_security_deposit_paid && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Security Deposit:</span>
                                    <span className="font-medium text-red-700">
                    {formatCurrency(unit.sec_deposit)}
                  </span>
                                </div>
                            )}
                            {!unit.is_advance_payment_paid && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Advance Payment:</span>
                                    <span className="font-medium text-red-700">
                    {formatCurrency(unit.advanced_payment)}
                  </span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-red-200">
                                <span className="font-medium text-gray-700">Total Due:</span>
                                <span className="font-bold text-red-800">
                  {formatCurrency(totalPaymentDue)}
                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    {unit.has_pending_proof ? (
                        <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 text-yellow-800">
                                <ClockIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">
                  Proof of payment submitted. Awaiting landlord confirmation.
                </span>
                            </div>
                        </div>
                    ) : showPayButton ? (
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={() => onPayment(unit.unit_id)}
                                disabled={loadingPayment}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingPayment ? (
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FaCreditCard className="w-4 h-4" />
                                )}
                                Pay through Maya
                            </button>

                            <button
                                onClick={() =>
                                    onUploadProof(unit.unit_id, unit.agreement_id, totalPaymentDue)
                                }
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
                            >
                                <FaUpload className="w-4 h-4" />
                                Upload Proof of Payment
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => onAccessPortal(unit.agreement_id)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
                        >
                            <HomeIcon className="w-4 h-4" />
                            Access Portal
                        </button>
                    )}

                    {/* Contact Landlord */}
                    <button
                        onClick={onContactLandlord}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
                    >
                        <FaComments className="w-4 h-4" />
                        Message Landlord
                    </button>
                </div>
            </div>
        </article>
    );
}
