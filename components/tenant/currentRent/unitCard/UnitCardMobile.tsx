"use client";

import Image from "next/image";
import {
  CurrencyDollarIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  HomeIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Unit } from "@/types/units";
import { formatCurrency } from "@/utils/formatter/formatters";

/* STATUS BADGE */
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
  const hasPendingProof = unit.has_pending_proof;
  const isLeaseExpired = new Date(unit.end_date) < new Date();

  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold";

  if (hasPendingProof)
    return (
      <span
        className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}
      >
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
        Pending
      </span>
    );

  if (isLeaseExpired)
    return (
      <span
        className={`${base} bg-gray-50 text-gray-700 border border-gray-200`}
      >
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
        Expired
      </span>
    );

  return (
    <span
      className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}
    >
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      Active
    </span>
  );
};

export default function UnitCardMobile({
  unit,
  onAccessPortal,
}: {
  unit: Unit;
  onAccessPortal: (agreementId: string) => void;
}) {
  const isLeaseExpired = new Date(unit.end_date) < new Date();

  return (
    <div
      onClick={() => onAccessPortal(unit.agreement_id)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all"
    >
      {/* Status Bar */}
      <div
        className={`h-1 ${
          isLeaseExpired
            ? "bg-gray-400"
            : unit.has_pending_proof
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
              alt={`Unit ${unit.unit_name}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-w-0">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-gray-900 truncate">
                Unit {unit.unit_name}
              </h2>
              <p className="text-xs text-gray-600 truncate">
                {unit.property_name}
              </p>
            </div>
            <LeaseStatusBadge unit={unit} />
          </div>

          {/* Details */}
          <div className="space-y-1">
            {/* Rent */}
            <div className="flex items-center gap-1">
              <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-700 text-sm">
                {formatCurrency(unit.rent_amount)}
              </span>
              <span className="text-xs text-gray-500">/mo</span>
            </div>

            {/* Location & Size */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
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
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}
