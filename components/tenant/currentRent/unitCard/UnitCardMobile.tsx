"use client";

import Image from "next/image";
import {
    CurrencyDollarIcon,
    PhotoIcon,
    MapPinIcon,
    HomeIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

import { Unit } from "@/types/units";
import { formatCurrency } from "@/utils/formatter/formatters";

/* ----------------------- SIGNATURE BADGE ----------------------- */
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
    const sig = unit.leaseSignature;

    const badgeStyles: any = {
        pending: {
            text: "Awaiting Signatures",
            color: "bg-amber-50 text-amber-700 border-amber-200",
        },
        sent: {
            text: "Waiting for Tenant to Sign",
            color: "bg-amber-50 text-amber-700 border-amber-200",
        },
        landlord_signed: {
            text: "Waiting for Tenant Signature",
            color: "bg-amber-50 text-amber-700 border-amber-200",
        },
        tenant_signed: {
            text: "Waiting for Landlord Signature",
            color: "bg-yellow-50 text-yellow-700 border-yellow-300",
        },
        active: {
            text: "Active",
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        completed: {
            text: "Completed",
            color: "bg-blue-50 text-blue-700 border-blue-200",
        },
    };

    const info = badgeStyles[sig] ?? badgeStyles.pending;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${info.color}`}
        >
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            {info.text}
    </span>
    );
};

/* ----------------------- MOBILE CARD ----------------------- */
export default function UnitCardMobile({
                                           unit,
                                           onAccessPortal,
                                       }: {
    unit: Unit;
    onAccessPortal: (agreementId: string) => void;
}) {
    const sig = unit.leaseSignature;

    const isLeaseExpired = new Date(unit.end_date) < new Date();

    const isSignaturePending =
        sig === "pending" ||
        sig === "sent" ||
        sig === "pending_signature" ||
        sig === "landlord_signed" ||
        sig === "tenant_signed";

    const isFullySigned = sig === "active" || sig === "completed";

    return (
        <div
            onClick={() => onAccessPortal(unit.agreement_id)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
                 active:scale-[0.98] transition-all"
        >
            {/* Status Bar */}
            <div
                className={`h-1 ${
                    isLeaseExpired
                        ? "bg-gray-400"
                        : isSignaturePending
                            ? "bg-amber-400"
                            : "bg-gradient-to-r from-emerald-500 to-blue-500"
                }`}
            />

            <div className="flex items-center gap-3 p-3">
                {/* IMAGE */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {unit.unit_photos?.[0] ? (
                        <Image
                            src={unit.unit_photos[0]}
                            fill
                            className="object-cover"
                            alt={unit.unit_name}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="w-8 h-8 text-gray-300" />
                        </div>
                    )}
                </div>

                {/* DETAILS */}
                <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                            <h2 className="font-bold text-sm text-gray-900 truncate">
                                Unit {unit.unit_name}
                            </h2>
                            <p className="text-xs text-gray-600 truncate">
                                {unit.property_name}
                            </p>
                        </div>

                        {/* Signature Badge */}
                        <LeaseStatusBadge unit={unit} />
                    </div>

                    {/* Rent */}
                    <div className="flex items-center gap-1 mb-1">
                        <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-700 text-sm">
              {formatCurrency(unit.rent_amount)}
            </span>
                        <span className="text-xs text-gray-500">/mo</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="flex items-center gap-1 truncate">
              <MapPinIcon className="w-3 h-3" />
                {unit.city}
            </span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
              <HomeIcon className="w-3 h-3" />
                            {unit.unit_size} sqm
            </span>
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
        </div>
    );
}
