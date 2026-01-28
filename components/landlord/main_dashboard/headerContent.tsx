"use client";

import Clock from "./Clock";
import {
  CARD_CONTAINER,
  GRADIENT_DOT,
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
  landlordId,
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
    <div className={CARD_CONTAINER}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* LEFT: Greeting */}
        <div className="flex-1 min-w-0">
          {/* Greeting */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1">
            <span className={GRADIENT_TEXT}>{greeting}</span>
            <span className="text-gray-400">, </span>
            <span className="text-gray-900">{displayName}</span>
          </h1>

          {/* Mobile Date */}
          <p className="text-sm text-gray-500 lg:hidden">
            {weekday}, {formattedDate}
          </p>
        </div>

        {/* RIGHT: Date & Time Card - Desktop Only */}
        <div className="hidden lg:block">
          <div
            className="bg-gradient-to-br from-blue-50 via-emerald-50 to-cyan-50 
                        px-6 py-4 rounded-xl border border-blue-100 shadow-inner"
          >
            <div className="flex flex-col items-end gap-1">
              {/* Time */}
              <div className={`text-2xl font-bold ${GRADIENT_TEXT}`}>
                <Clock />
              </div>
              {/* Weekday */}
              <div className="text-sm font-semibold text-gray-700">
                {weekday}
              </div>
              {/* Date */}
              <div className="text-xs text-gray-500">{formattedDate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
