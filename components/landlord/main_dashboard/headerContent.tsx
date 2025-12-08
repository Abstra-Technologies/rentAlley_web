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

        /* LESS VERTICAL SPACE */
        py-2 sm:py-3

        text-gray-900
      "
        >
            {/* LEFT: Greeting */}
            <div className="text-left space-y-0.5 w-full sm:w-auto">
                <h2
                    className="
            font-semibold tracking-tight
            text-lg sm:text-3xl lg:text-4xl
          "
                >
                    {greeting}, {displayName}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 leading-tight">
          <span className="hidden sm:inline">
            Simplifying property management, empowering landlords.
          </span>
                    <span className="sm:hidden">Welcome back!</span>
                </p>
            </div>

            {/* RIGHT: Clock + Date */}
            <div
                className="
          flex flex-row sm:flex-row
          items-center sm:items-center

          /* REDUCE GAP */
          gap-2 sm:gap-4

          mt-2 sm:mt-0
          w-full sm:w-auto
          text-right sm:text-right
        "
            >
                {/* Clock */}
                <div className="text-lg sm:text-2xl lg:text-3xl font-semibold leading-tight">
                    <Clock />
                </div>

                {/* Date */}
                <div className="text-xs sm:text-base lg:text-lg font-medium text-gray-700 leading-tight">
                    {formattedDate}
                </div>
            </div>
        </div>
    );
}
