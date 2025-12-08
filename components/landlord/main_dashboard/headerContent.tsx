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
        px-3 sm:px-5 lg:px-6
        py-2 sm:py-3
        text-gray-900
      "
        >
            {/* LEFT: Greeting */}
            <div className="text-left space-y-0.5">
                <h2 className="font-semibold tracking-tight text-lg sm:text-3xl lg:text-4xl">
                    {greeting}, {displayName}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 leading-tight">
          <span className="hidden sm:inline">
            Simplifying property management, empowering landlords.
          </span>
                    <span className="sm:hidden">Welcome back!</span>
                </p>
            </div>

            {/* RIGHT SIDE — TIME + DATE ON DESKTOP ONLY */}
            <div
                className="
          hidden
          sm:flex
          flex-row items-center
          gap-2 sm:gap-3
          text-right
        "
            >
                {/* Time */}
                <div className="text-base sm:text-xl lg:text-2xl font-semibold leading-none">
                    <Clock />
                </div>

                {/* Dot separator */}
                <span className="text-gray-400">•</span>

                {/* Date */}
                <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 leading-none">
                    {formattedDate}
                </div>
            </div>
        </div>
    );
}
