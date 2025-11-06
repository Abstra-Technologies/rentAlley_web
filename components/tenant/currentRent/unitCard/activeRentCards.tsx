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
import { FaHome, FaComments } from "react-icons/fa";
import { RefreshCw, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { Unit } from "@/types/units";

// --- Status Badge ---
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
    const hasPendingProof = unit.has_pending_proof;
    const isLeaseExpired = new Date(unit.end_date) < new Date();

    if (hasPendingProof) {
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                <ClockIcon className="w-3.5 h-3.5" />
                <span>Pending Review</span>
            </div>
        );
    }

    if (isLeaseExpired) {
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                <span>Expired</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            <span>Active</span>
        </div>
    );
};

// --- UnitCard Component ---
export default function UnitCard({
                                     unit,
                                     onContactLandlord,
                                     onAccessPortal,
                                     onRenewLease,
                                     onEndContract,
                                 }: {
    unit: Unit;
    onContactLandlord: () => void;
    onAccessPortal: (agreementId: string) => void;
    onRenewLease: (unitId: string, agreementId: string) => void;
    onEndContract: (unitId: string, agreementId: string) => void;
}) {
    const isLeaseExpired = new Date(unit.end_date) < new Date();

    return (
        <article className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 overflow-hidden flex flex-col h-full">
            {/* Image Section */}
            <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                {unit.unit_photos?.[0] ? (
                    <Image
                        src={unit.unit_photos[0]}
                        alt={`Unit ${unit.unit_name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        priority={false}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
                        <PhotoIcon className="w-20 h-20 text-gray-300" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
                    <LeaseStatusBadge unit={unit} />
                </div>

                {/* Billing Info */}
                {unit.due_date && unit.due_day && !isLeaseExpired && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600/95 to-emerald-600/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold py-2.5 px-4 border-t border-white/10">
                        <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span>
                  Bills on the{" "}
                    <span className="font-extrabold">{unit.due_day}</span>
                    {unit.due_day === 1
                        ? "st"
                        : unit.due_day === 2
                            ? "nd"
                            : unit.due_day === 3
                                ? "rd"
                                : "th"}
                </span>
              </span>
                            <span className="font-extrabold">
                {formatDate(unit.due_date)}
              </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex-shrink-0 shadow-md">
                            <HomeIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                Unit {unit.unit_name}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5 font-medium">
                                {unit.property_name}
                            </p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 text-gray-600 mb-4">
                        <MapPinIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm line-clamp-2 font-medium">
                            {unit.city}, {unit.province}
                        </p>
                    </div>

                    {/* Info Badges */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                            <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
                            <div className="flex items-baseline gap-1">
                <span className="font-bold text-blue-700 text-base">
                  {formatCurrency(unit.rent_amount)}
                </span>
                                <span className="text-xs text-blue-600 font-semibold">/mo</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
                            <FaHome className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-emerald-700 text-sm">
                {unit.unit_size} sqm
              </span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4"></div>

                {/* Lease Period */}
                <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
              Lease Period
            </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <span>{formatDate(unit.start_date)}</span>
                        <span className="text-blue-500">→</span>
                        <span>{formatDate(unit.end_date)}</span>
                    </div>
                    {isLeaseExpired && (
                        <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                            Lease has expired
                        </p>
                    )}
                </div>

                {/* Pending Proof */}
                {unit.has_pending_proof && !isLeaseExpired && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-300 shadow-sm">
                        <div className="flex items-start gap-2.5 text-amber-900">
                            <ClockIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold">Payment Under Review</p>
                                <p className="text-xs mt-1 text-amber-700">
                                    Your proof has been submitted and is awaiting landlord
                                    verification.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-auto space-y-2.5">
                    <button
                        onClick={() => onAccessPortal(unit.agreement_id)}
                        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl font-bold text-base shadow-md hover:shadow-xl transition-all duration-300"
                    >
                        <HomeIcon className="w-5 h-5" />
                        <span>Access Rental Portal</span>
                    </button>

                    {isLeaseExpired && (
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={() => onRenewLease(unit.unit_id, unit.agreement_id)}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Renew</span>
                            </button>
                            <button
                                onClick={() => onEndContract(unit.unit_id, unit.agreement_id)}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>End Lease</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onContactLandlord}
                        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-bold text-base shadow-md hover:shadow-xl transition-all duration-300"
                    >
                        <FaComments className="w-5 h-5" />
                        <span>Message Landlord</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
