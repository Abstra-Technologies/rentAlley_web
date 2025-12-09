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
    year: "numeric",
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
      {/* LEFT: Greeting */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
          {greeting}, {displayName}
        </h1>
        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
          <span className="hidden sm:inline">
            Simplifying property management, empowering landlords.
          </span>
          <span className="sm:hidden">Welcome back!</span>
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-right flex-shrink-0">
        <div className="flex flex-col items-end">
          <div className="text-xl lg:text-2xl font-bold text-gray-900">
            <Clock />
          </div>
          <div className="text-xs lg:text-sm text-gray-600 mt-0.5">
            {formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
}
