"use client";

import Image from "next/image";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { FaComments } from "react-icons/fa";
import { RefreshCw, XCircle } from "lucide-react";
import { Unit } from "@/types/units";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

/* ----------------------- STATUS BADGE ----------------------- */
const LeaseStatusBadge = ({ unit }: { unit: Unit }) => {
  const hasPendingProof = unit.has_pending_proof;
  const isLeaseExpired = new Date(unit.end_date) < new Date();

  const base =
    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold";

  if (hasPendingProof)
    return (
      <span className={`${base} bg-amber-500 text-white shadow`}>
        <ClockIcon className="w-3 h-3" /> Pending
      </span>
    );

  if (isLeaseExpired)
    return (
      <span className={`${base} bg-gray-700 text-white shadow`}>
        <ExclamationTriangleIcon className="w-3 h-3" /> Expired
      </span>
    );

  return (
    <span className={`${base} bg-emerald-600 text-white shadow`}>
      <CheckCircleIcon className="w-3 h-3" /> Active
    </span>
  );
};

/* ----------------------- MAIN COMPONENT ----------------------- */
export default function UnitCardDesktop({
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
    <article
      className="
        bg-white rounded-2xl border border-gray-200 
        shadow-sm hover:shadow-xl hover:-translate-y-1 hover:bg-gray-50/40
        transition-all duration-300 overflow-hidden
      "
    >
      {/* HEADER IMAGE */}
<div className="relative h-32">
  {unit.unit_photos?.[0] ? (
    <Image
      src={unit.unit_photos[0]}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-105"
      alt="unit"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <PhotoIcon className="w-16 h-16 text-gray-300" />
    </div>
  )}

  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

  <div className="absolute top-3 left-3">
    <LeaseStatusBadge unit={unit} />
  </div>

  {unit.due_date && unit.due_day && !isLeaseExpired && (
    <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-sm px-4 py-2 flex justify-between">
      <span className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4" />
        Billing every {unit.due_day} of the month.
      </span>
      <span className="font-semibold">{formatDate(unit.due_date)}</span>
    </div>
  )}
</div>


      {/* CONTENT */}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div>
          <h2 className="font-bold text-xl text-gray-900">Unit {unit.unit_name}</h2>
          <p className="text-gray-600">{unit.property_name}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPinIcon className="w-4 h-4 text-blue-600" />
            {unit.city}, {unit.province}
          </p>
        </div>

        {/* Specs */}
        <div className="flex gap-4 text-sm font-medium">
          <span className="flex items-center gap-1">
            <HomeIcon className="w-5 h-5 text-emerald-600" />
            {unit.unit_size} sqm
          </span>

          <span className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 font-bold">
              {formatCurrency(unit.rent_amount)}
            </span>
            /mo
          </span>
        </div>

        {/* INSIDE BANNER */}
        {/* {!isLeaseExpired && unit.due_date && unit.due_day && (
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 p-3 shadow-sm">
            <div className="flex items-center gap-2 text-blue-800 font-semibold">
              <CalendarIcon className="w-4 h-4" />
              Next Bill: {formatDate(unit.due_date)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Billing every <b>{unit.due_day}</b> of the month
            </p>
          </div>
        )} */}

        {/* BUTTON STACK */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Access Portal */}
          <button
            onClick={() => onAccessPortal(unit.agreement_id)}
            className="
              w-full py-2.5 rounded-lg font-semibold text-white 
              bg-gradient-to-r from-blue-600 to-blue-700 
              hover:from-blue-700 hover:to-blue-800 
              shadow-sm hover:shadow-md transition-all
            "
          >
            Access Portal
          </button>

          {/* Message Landlord */}
          <button
            onClick={onContactLandlord}
            className="
              w-full py-2.5 rounded-lg font-semibold text-white 
              bg-gradient-to-r from-indigo-600 to-indigo-700 
              hover:from-indigo-700 hover:to-indigo-800 
              shadow-sm hover:shadow-md transition-all
              flex items-center justify-center gap-2
            "
          >
            <FaComments className="w-4 h-4" /> Message Landlord
          </button>

          {/* Expired Actions */}
          {isLeaseExpired && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onRenewLease(unit.unit_id, unit.agreement_id)}
                className="
                  py-2.5 rounded-lg font-semibold text-white 
                  bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md
                  flex items-center justify-center gap-2
                "
              >
                <RefreshCw className="w-4 h-4" /> Renew
              </button>

              <button
                onClick={() => onEndContract(unit.unit_id, unit.agreement_id)}
                className="
                  py-2.5 rounded-lg font-semibold text-white 
                  bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md
                  flex items-center justify-center gap-2
                "
              >
                <XCircle className="w-4 h-4" /> End Lease
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
