"use client";

import Image from "next/image";
import {
    MapPinIcon,
    PhotoIcon,
    HomeIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";

import { Unit } from "@/types/units";
import { formatDate } from "@/utils/formatter/formatters";

/* ----------------------- MAIN CARD ----------------------- */
export default function UnitCardDesktop({
                                            unit,
                                            onContactLandlord,
                                            onAccessPortal,
                                        }: {
    unit: Unit;
    onContactLandlord: () => void;
    onAccessPortal: (agreementId: string) => void;
}) {
    const showBillingBanner =
        Boolean(unit.due_date && unit.due_day);

    return (
        <article className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden">
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

                {/* BILLING DUE DATE BANNER */}
                {showBillingBanner && (
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
                    <p className='text-sm'>Agrrement id: {unit?.agreement_id}</p>
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

                {/* ACTIONS */}
                <div className="space-y-2 pt-2">
                    <button
                        onClick={() => onAccessPortal(unit.agreement_id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5
              bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg
              font-semibold text-sm hover:opacity-95"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Access Rental Portal
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
                </div>
            </div>
        </article>
    );
}
