"use client";

import Clock from "./Clock";
import {
    CARD_CONTAINER,
    GRADIENT_TEXT,
} from "@/constant/design-constants";

interface HeaderContentProps {
    greeting: string;
    displayName: string;
    landlordId: string;
}

export default function HeaderContent({
                                          greeting,
                                          displayName,
                                      }: HeaderContentProps) {
    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const weekday = today.toLocaleDateString("en-US", {
        weekday: "long",
    });

    return (
        <div className={`${CARD_CONTAINER} py-4 px-5`}>
            <div className="flex items-center justify-between gap-4">
                {/* LEFT: Greeting */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight truncate">
                        <span className={GRADIENT_TEXT}>{greeting}</span>
                        <span className="text-gray-400">, </span>
                        <span className="text-gray-900">{displayName}</span>
                    </h1>

                    <p>Here's whats happening with your properties today</p>

                    {/* Date (mobile + subtle) */}
                    <p className="text-xs text-gray-500 mt-0.5 lg:hidden">
                        {weekday}, {formattedDate}
                    </p>
                </div>

                {/* RIGHT: Time (desktop only, slimmer) */}
                <div className="hidden lg:flex items-center gap-3">
                    <div
                        className="bg-gradient-to-br from-blue-50 via-emerald-50 to-cyan-50
                       px-4 py-2 rounded-lg border border-blue-100"
                    >
                        <div className="flex flex-col items-end leading-tight">
                            <div className={`text-lg font-bold ${GRADIENT_TEXT}`}>
                                <Clock />
                            </div>
                            <div className="text-[11px] font-medium text-gray-600">
                                {weekday}
                            </div>
                            <div className="text-[10px] text-gray-500">
                                {formattedDate}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
