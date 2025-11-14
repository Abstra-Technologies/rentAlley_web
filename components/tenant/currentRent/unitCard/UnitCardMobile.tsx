"use client";

import Image from "next/image";
import {
  CurrencyDollarIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Unit } from "@/types/units";
import { formatCurrency } from "@/utils/formatter/formatters";

/* STATUS BADGE */
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
  const hasPendingProof = unit.has_pending_proof;
  const isLeaseExpired = new Date(unit.end_date) < new Date();

  if (hasPendingProof)
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded-full">
        <ClockIcon className="w-3 h-3" /> Pending
      </span>
    );

  if (isLeaseExpired)
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-gray-600 text-white text-[10px] font-semibold rounded-full">
        <ExclamationTriangleIcon className="w-3 h-3" /> Expired
      </span>
    );

  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-semibold rounded-full">
      <CheckCircleIcon className="w-3 h-3" /> Active
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
  return (
    <div
      onClick={() => onAccessPortal(unit.agreement_id)}
      className="
        w-full flex items-center gap-3 p-3 border-b cursor-pointer 
        hover:bg-gray-50 active:bg-gray-100 transition select-none
      "
    >
      {/* IMAGE — Slimmer */}
      <div className="relative w-24 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        {unit.unit_photos?.[0] ? (
          <Image
            src={unit.unit_photos[0]}
            fill
            className="object-cover"
            alt="unit"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* TEXT CONTENT */}
      <div className="flex-1 min-w-0">
        {/* Top Row: Unit + Status */}
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm truncate">
              Unit {unit.unit_name}
            </h2>

            {/* PROPERTY NAME (kept!) */}
            <p className="text-xs text-gray-500 truncate">
              {unit.property_name}
            </p>
          </div>

          <LeaseStatusBadge unit={unit} />
        </div>

        {/* RENT ONLY */}
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-700">
          <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-blue-700">
            {formatCurrency(unit.rent_amount)}
          </span>
          <span className="text-gray-500">/mo</span>
        </div>
      </div>
    </div>
  );
}
