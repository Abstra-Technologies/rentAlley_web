"use client";

import Clock from "./Clock";

export default function HeaderContent({
                                          greeting,
                                          displayName,
                                      }: {
    greeting: string;
    displayName: string;
}) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });

    return (
        <div
            className="
        flex flex-col sm:flex-row
        items-start sm:items-center
        justify-between
        w-full
        px-3 sm:px-4 lg:px-5
        py-1.5 sm:py-2
        text-gray-900
      "
        >
            {/* LEFT: Greeting */}
            <div className="text-left space-y-0.5">
                <h2 className="font-semibold tracking-tight text-[18px] sm:text-[26px] lg:text-[32px] leading-snug">
                    {greeting}, {displayName}
                </h2>

                <p className="text-[11px] sm:text-[13px] text-gray-600 leading-tight">
          <span className="hidden sm:inline">
            Simplifying property management, empowering landlords.
          </span>
                    <span className="sm:hidden">Welcome back!</span>
                </p>
            </div>

            {/* RIGHT: Clock + Date (desktop only) */}
            <div
                className="
          hidden sm:flex
          flex-row items-center
          gap-2 sm:gap-2.5
          text-right
        "
            >
                {/* Time */}
                <div className="text-[14px] sm:text-[18px] lg:text-[22px] font-semibold leading-none">
                    <Clock />
                </div>

                {/* Dot */}
                <span className="text-gray-400">•</span>

                {/* Date */}
                <div className="text-[12px] sm:text-[14px] lg:text-[16px] font-medium text-gray-700 leading-none">
                    {formattedDate}
                </div>
            </div>
        </div>
    );
}
