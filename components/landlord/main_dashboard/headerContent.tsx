"use client";

import Clock from "./Clock";

export default function HeaderContent({
                                          greeting,
                                          displayName,
                                          landlordId,
                                      }: {
    greeting: string;
    displayName: string;
    landlordId?: number;
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
        w-full h-full
        px-3 sm:px-5 lg:px-6
        py-4
        text-white
      "
        >
            {/* LEFT: Greeting */}
            <div className="text-left space-y-1 w-full sm:w-auto">
                <h2
                    className="
            font-semibold tracking-tight drop-shadow-sm
            text-[1.3rem] sm:text-3xl lg:text-4xl
          "
                >
                    {greeting}, {displayName}
                </h2>

                <p className="text-[11px] sm:text-sm text-gray-200 leading-snug">
          <span className="hidden sm:inline">
            Simplifying property management, empowering landlords.
          </span>
                    <span className="sm:hidden">Welcome back!</span>
                </p>
            </div>

            {/* RIGHT: Clock + Date */}
            <div
                className="
          flex flex-col sm:flex-row
          items-end sm:items-center
          gap-1 sm:gap-4
          mt-3 sm:mt-0
          w-full sm:w-auto
          text-right
        "
            >
                {/* Clock (Bigger Fonts) */}
                <div className="text-lg sm:text-xl lg:text-2xl font-semibold">
                    <Clock />
                </div>

                {/* Date (Bigger Fonts) */}
                <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-200">
                    {formattedDate}
                </div>
            </div>
        </div>
    );
}
