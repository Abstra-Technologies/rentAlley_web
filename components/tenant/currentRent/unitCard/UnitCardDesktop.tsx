"use client";

import Image from "next/image";
import {
    CalendarIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    PhotoIcon,
    HomeIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { RefreshCw, XCircle } from "lucide-react";

import { Unit } from "@/types/units";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import PendingDocumentsWidget from "../../analytics-insights/PendingDocumentsWidget";

/* ----------------------- SIGNATURE BADGE ----------------------- */
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
    const sig = unit.leaseSignature;

    const base =
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border-2";

    const badge = {
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

    const info = badge[sig] ?? badge.pending;

    return (
        <span className={`${base} ${info.color}`}>
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            {info.text}
    </span>
    );
};

/* ----------------------- MAIN CARD ----------------------- */
export default function UnitCardDesktop({
                                            unit,
                                            onContactLandlord,
                                            onAccessPortal,
                                            onRenewLease,
                                            onEndContract,
                                            onPayInitial,
                                        }: {
    unit: Unit;
    onContactLandlord: () => void;
    onAccessPortal: (agreementId: string) => void;
    onRenewLease: (unitId: string, agreementId: string) => void;
    onEndContract: (unitId: string, agreementId: string) => void;
    onPayInitial: (agreementId: string) => void;
}) {
    const sig = unit.leaseSignature;
    const isLeaseExpired = new Date(unit.end_date) < new Date();

    /* ----------------------- SIGNATURE STATES (UNCHANGED) ----------------------- */
    const isSignaturePending =
        sig === "pending" ||
        sig === "sent" ||
        sig === "pending_signature" ||
        sig === "landlord_signed" ||
        sig === "tenant_signed";

    const isFullySigned = sig === "active" || sig === "completed";

    /* ----------------------- PAYABLE STATES ----------------------- */
    const requiresSecurityDeposit =
        Number(unit.security_deposit_amount) > 0 &&
        unit.security_deposit_status !== "paid";

    const requiresAdvancePayment =
        Number(unit.advance_payment_amount) > 0 &&
        unit.advance_payment_status !== "paid";

    const hasInitialPayables =
        requiresSecurityDeposit || requiresAdvancePayment;

    return (
        <article className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">

            {/* Status Bar */}
            <div
                className={`h-1 ${
                    isLeaseExpired
                        ? "bg-gray-400"
                        : isSignaturePending && !isFullySigned
                            ? "bg-amber-400"
                            : "bg-gradient-to-r from-emerald-500 to-blue-500"
                }`}
            />

            {/* IMAGE */}
            <div className="relative h-48 overflow-hidden bg-gray-100">
                {unit.unit_photos?.[0] ? (
                    <Image
                        src={unit.unit_photos[0]}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={`Unit ${unit.unit_name}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-16 h-16 text-gray-300" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3">
                    <LeaseStatusBadge unit={unit} />
                </div>

                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                    <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-700 text-sm">
              {formatCurrency(unit.rent_amount)}
            </span>
                        <span className="text-xs text-gray-600">/mo</span>
                    </div>
                </div>

                {unit.due_date && unit.due_day && !isLeaseExpired && isFullySigned && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-4 py-2.5 text-xs backdrop-blur-sm">
                        <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                Next Bill: {formatDate(unit.due_date)}
              </span>
                            <span>Due: {unit.due_day}th</span>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="p-4">
                <h2 className="font-bold text-lg text-gray-900 mb-1">
                    Unit {unit.unit_name}
                </h2>
                <p className="text-sm font-medium text-gray-700 mb-2">
                    {unit.property_name}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <MapPinIcon className="w-3.5 h-3.5 text-blue-600" />
              {unit.city}, {unit.province}
          </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
            <HomeIcon className="w-3.5 h-3.5 text-emerald-600" />
                        {unit.unit_size} sqm
          </span>
                </div>

                {/* ACTIONS */}
                <div className="space-y-2">

                    {/* PENDING DOCUMENTS */}
                    {isSignaturePending && !isFullySigned && (
                        <PendingDocumentsWidget agreement_id={unit.agreement_id} />
                    )}

                    {/* FULLY SIGNED */}
                    {isFullySigned && (
                        <>
                            {/* PAY INITIAL (BLOCKS PORTAL) */}
                            {hasInitialPayables && (
                                <button
                                    onClick={() => onPayInitial(unit.agreement_id)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                  bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-lg
                  font-semibold text-sm hover:shadow-lg"
                                >
                                    <CurrencyDollarIcon className="w-4 h-4" />
                                    {requiresSecurityDeposit && requiresAdvancePayment
                                        ? "Pay Security Deposit + Advance"
                                        : requiresSecurityDeposit
                                            ? "Pay Security Deposit"
                                            : "Pay Advance Payment"}
                                </button>
                            )}

                            {/* ACCESS PORTAL (ONLY WHEN PAID — EVEN IF EXPIRED) */}
                            {!hasInitialPayables && (
                                <button
                                    onClick={() => onAccessPortal(unit.agreement_id)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                  bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg
                  font-semibold text-sm hover:shadow-md"
                                >
                                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                    Access Portal
                                </button>
                            )}

                            {/* CONTACT LANDLORD */}
                            <button
                                onClick={onContactLandlord}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg
                font-semibold text-sm"
                            >
                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                Message Landlord
                            </button>

                            {/* EXPIRED ACTIONS */}
                            {isLeaseExpired && (
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                                    <button
                                        onClick={() =>
                                            onRenewLease(unit.unit_id, unit.agreement_id)
                                        }
                                        className="flex items-center justify-center gap-1.5 py-2 px-3
                    bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> Renew
                                    </button>

                                    <button
                                        onClick={() =>
                                            onEndContract(unit.unit_id, unit.agreement_id)
                                        }
                                        className="flex items-center justify-center gap-1.5 py-2 px-3
                    bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs"
                                    >
                                        <XCircle className="w-3.5 h-3.5" /> End Lease
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}
