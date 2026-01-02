"use client";

import { useEffect, useState } from "react";
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
import { RefreshCw, XCircle, Clock } from "lucide-react";

import { Unit } from "@/types/units";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import PendingDocumentsWidget from "../../analytics-insights/PendingDocumentsWidget";

/* ----------------------- CONSTANTS ----------------------- */
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

/* ----------------------- COUNTDOWN HOOK ----------------------- */
const useCountdown = (endedAt?: string) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!endedAt) return;

        const update = () => {
            const diff =
                new Date(endedAt).getTime() + THREE_DAYS_MS - Date.now();
            setTimeLeft(Math.max(0, diff));
        };

        update();
        const interval = setInterval(update, ONE_MINUTE_MS);

        return () => clearInterval(interval);
    }, [endedAt]);

    if (timeLeft === null) return null;

    const totalMinutes = Math.ceil(timeLeft / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes };
};

/* ----------------------- SIGNATURE BADGE ----------------------- */
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
    const sig = unit.leaseSignature;

    const badge = {
        pending: "bg-amber-50 text-amber-700 border-amber-200",
        sent: "bg-amber-50 text-amber-700 border-amber-200",
        landlord_signed: "bg-amber-50 text-amber-700 border-amber-200",
        tenant_signed: "bg-yellow-50 text-yellow-700 border-yellow-300",
        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
        completed: "bg-gray-100 text-gray-600 border-gray-300",
    };

    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${
                badge[sig] ?? badge.pending
            }`}
        >
      <span className="w-1.5 h-1.5 bg-current rounded-full" />
            {sig}
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
    const isLeaseCompleted = unit.leaseSignature === "completed";
    const isLeaseExpired = new Date(unit.end_date) < new Date();

    const countdown = useCountdown(unit.lease_ended_at);

    const isSignaturePending =
        unit.leaseSignature !== "active" &&
        unit.leaseSignature !== "completed";

    const isFullySigned =
        unit.leaseSignature === "active" ||
        unit.leaseSignature === "completed";

    return (
        <article
            className={`bg-white rounded-xl border shadow-sm transition-all overflow-hidden
        ${
                isLeaseCompleted
                    ? "opacity-70 grayscale-[35%]"
                    : "hover:shadow-md"
            }`}
        >
            {/* STATUS BAR */}
            <div
                className={`h-1 ${
                    isLeaseCompleted
                        ? "bg-gray-400"
                        : isSignaturePending
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
                        className="object-cover"
                        alt={`Unit ${unit.unit_name}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-16 h-16 text-gray-300" />
                    </div>
                )}

                <div className="absolute top-3 left-3">
                    <LeaseStatusBadge unit={unit} />
                </div>

                {/* LIVE COUNTDOWN */}
                {isLeaseCompleted && countdown && (
                    <div className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur">
                        <Clock className="w-3.5 h-3.5" />
                        Removed in {countdown.days}d {countdown.hours}h{" "}
                        {countdown.minutes}m
                    </div>
                )}

                {unit.due_date && unit.due_day && isFullySigned && !isLeaseCompleted && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-4 py-2.5 text-xs">
                        <div className="flex justify-between">
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
            <div className="p-4 space-y-3">
                <div>
                    <h2 className="font-bold text-lg text-gray-900">
                        Unit {unit.unit_name}
                    </h2>
                    <p className="text-sm font-medium text-gray-700">
                        {unit.property_name}
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600">
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

                {/* ACTIONS (UNCHANGED) */}
                <div className="space-y-2 pt-2">
                    {isSignaturePending && !isFullySigned && (
                        <PendingDocumentsWidget agreement_id={unit.agreement_id} />
                    )}

                    <button
                        onClick={() => onAccessPortal(unit.agreement_id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5
              bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg
              font-semibold text-sm"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Access Portal
                    </button>

                    <button
                        onClick={onContactLandlord}
                        className="w-full flex items-center justify-center gap-2 py-2.5
              bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg
              font-semibold text-sm"
                    >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        Message Landlord
                    </button>

                    {isLeaseExpired && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <button
                                onClick={() =>
                                    onRenewLease(unit.unit_id, unit.agreement_id)
                                }
                                className="flex items-center justify-center gap-1.5 py-2
                  bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Renew
                            </button>

                            <button
                                onClick={() =>
                                    onEndContract(unit.unit_id, unit.agreement_id)
                                }
                                className="flex items-center justify-center gap-1.5 py-2
                  bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs"
                            >
                                <XCircle className="w-3.5 h-3.5" /> End Lease
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
