"use client";

import Image from "next/image";
import {
    CurrencyDollarIcon,
    PhotoIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { RefreshCw, XCircle } from "lucide-react";

import { Unit } from "@/types/units";
import { formatCurrency } from "@/utils/formatter/formatters";
import PendingDocumentsWidget from "../../analytics-insights/PendingDocumentsWidget";

/* ----------------------- BADGE ----------------------- */
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
    const sig = unit.leaseSignature;

    const badge: any = {
        pending: { text: "Awaiting Signatures", color: "bg-amber-100 text-amber-700" },
        sent: { text: "Waiting for Tenant", color: "bg-amber-100 text-amber-700" },
        landlord_signed: { text: "Waiting for Tenant", color: "bg-amber-100 text-amber-700" },
        tenant_signed: { text: "Waiting for Landlord", color: "bg-yellow-100 text-yellow-700" },
        active: { text: "Active", color: "bg-emerald-100 text-emerald-700" },
        completed: { text: "Completed", color: "bg-blue-100 text-blue-700" },
    };

    const info = badge[sig] ?? badge.pending;

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${info.color}`}>
      {info.text}
    </span>
    );
};

/* ----------------------- MOBILE CARD ----------------------- */
export default function UnitCardMobile({
                                           unit,
                                           onAccessPortal,
                                           onPayInitial,
                                           onRenewLease,
                                           onEndContract,
                                           onContactLandlord,
                                       }: {
    unit: Unit;
    onAccessPortal: (agreementId: string) => void;
    onPayInitial: (agreementId: string) => void;
    onRenewLease: (unitId: string, agreementId: string) => void;
    onEndContract: (unitId: string, agreementId: string) => void;
    onContactLandlord: () => void;
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

    const requiresSecurityDeposit =
        Number(unit.security_deposit_amount) > 0 &&
        unit.security_deposit_status !== "paid";

    const requiresAdvancePayment =
        Number(unit.advance_payment_amount) > 0 &&
        unit.advance_payment_status !== "paid";

    const hasInitialPayables = requiresSecurityDeposit || requiresAdvancePayment;

    return (
        <article
            className="bg-white rounded-xl
  border-2 border-gray-200
  shadow-sm overflow-hidden
  hover:border-gray-300
  transition-colors"
        >

            {/* HEADER */}
            <div className="flex gap-3 p-3">
                {/* IMAGE */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {unit.unit_photos?.[0] ? (
                        <Image src={unit.unit_photos[0]} fill className="object-cover" alt={unit.unit_name} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="w-7 h-7 text-gray-300" />
                        </div>
                    )}
                </div>

                {/* CORE INFO */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="font-bold text-sm text-gray-900 truncate">
                                Unit {unit.unit_name}
                            </h2>
                            <p className="text-xs text-gray-600 truncate">
                                {unit.property_name}
                            </p>
                        </div>
                        <LeaseStatusBadge unit={unit} />
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                        <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-700 text-sm">
              {formatCurrency(unit.rent_amount)}
            </span>
                        <span className="text-xs text-gray-500">/mo</span>
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="px-3 pb-3 space-y-2">

                {/* Pending Docs */}
                {isSignaturePending && !isFullySigned && (
                    <PendingDocumentsWidget agreement_id={unit.agreement_id} />
                )}

                {/* Pay Initial */}
                {isFullySigned && hasInitialPayables && (
                    <button
                        onClick={() => onPayInitial(unit.agreement_id)}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold
              bg-gradient-to-r from-pink-600 to-red-600 text-white"
                    >
                        {requiresSecurityDeposit && requiresAdvancePayment
                            ? "Pay Security + Advance"
                            : requiresSecurityDeposit
                                ? "Pay Security Deposit"
                                : "Pay Advance Payment"}
                    </button>
                )}

                {/* Access Portal */}
                {isFullySigned && !hasInitialPayables && (
                    <button
                        onClick={() => onAccessPortal(unit.agreement_id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
              bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Access Portal
                    </button>
                )}

                {/* Message Landlord (always visible when signed) */}
                {isFullySigned && (
                    <button
                        onClick={onContactLandlord}
                        className="w-full flex items-center justify-center gap-2 py-2
              bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold"
                    >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        Message Landlord
                    </button>
                )}

                {/* Expired */}
                {isFullySigned && isLeaseExpired && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <button
                            onClick={() => onRenewLease(unit.unit_id, unit.agreement_id)}
                            className="py-2 text-xs rounded-lg bg-emerald-600 text-white"
                        >
                            <RefreshCw className="w-3 h-3 inline mr-1" />
                            Renew
                        </button>

                        <button
                            onClick={() => onEndContract(unit.unit_id, unit.agreement_id)}
                            className="py-2 text-xs rounded-lg bg-red-600 text-white"
                        >
                            <XCircle className="w-3 h-3 inline mr-1" />
                            End
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}
