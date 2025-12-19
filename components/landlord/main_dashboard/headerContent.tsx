"use client";

import Clock from "./Clock";

interface HeaderContentProps {
    greeting: string;
    displayName: string;
    landlordId: string; // Passed down from parent (LandlordMainDashboard)
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* LEFT: Greeting */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Dashboard
            </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold truncate">
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {greeting}
            </span>
                        <span className="text-gray-500">, </span>
                        <span className="text-gray-900">{displayName}</span>
                    </h1>
                </div>

                {/* RIGHT: Date & Time - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3 rounded-lg border border-blue-100/50">
                    <div className="flex flex-col items-end">
                        <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                            <Clock />
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">{formattedDate}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}