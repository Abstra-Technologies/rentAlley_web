"use client";

import Image from "next/image";
import {
    CurrencyDollarIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { Unit } from "@/types/units";
import { formatCurrency } from "@/utils/formatter/formatters";

/* ----------------------- MOBILE CARD (SIMPLIFIED) ----------------------- */
export default function UnitCardMobile({
                                           unit,
                                           onAccessPortal,
                                           onContactLandlord,
                                       }: {
    unit: Unit;
    onAccessPortal: (agreementId: string) => void;
    onContactLandlord: () => void;
}) {
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
                    <Image
                        src={
                            unit.unit_photos?.[0] ||
                            process.env.NEXT_PUBLIC_UNIT_PLACEHOLDER!
                        }
                        fill
                        className="object-cover"
                        alt={unit.unit_name}
                    />
                </div>

                {/* CORE INFO */}
                <div className="flex-1 min-w-0">
                    <div>
                        <h2 className="font-bold text-sm text-gray-900 truncate">
                            Unit {unit.unit_name}
                        </h2>
                        <p className="text-xs text-gray-600 truncate">
                            {unit.property_name}
                        </p>
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
                {/* Access Portal */}
                <button
                    onClick={() => onAccessPortal(unit.agreement_id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                    bg-gradient-to-r from-blue-600 to-emerald-600
                    text-white text-sm font-semibold"
                >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Access Portal
                </button>

                {/* Message Landlord */}
                <button
                    onClick={onContactLandlord}
                    className="w-full flex items-center justify-center gap-2 py-2
                    bg-gray-100 hover:bg-gray-200
                    text-gray-700 rounded-lg text-sm font-semibold"
                >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    Message Landlord
                </button>
            </div>
        </article>
    );
}
