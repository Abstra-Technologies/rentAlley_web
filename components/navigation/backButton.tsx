"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({
                               label = "Back",
                               fallback = "/pages/landlord/property-listing",
                           }: {
    label?: string;
    fallback?: string;
}) {
    const router = useRouter();

    const handleBack = () => {
        // ✅ If user has no previous navigation history, replace instead of back
        if (typeof window !== "undefined") {
            router.replace(fallback);
        } else {
            router.back();
        }
    };

    return (
        <button
            onClick={handleBack}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium
        rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-emerald-500 overflow-hidden"
        >
            {/* Animated gradient border */}
            <span className="absolute inset-0 rounded-lg p-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-gradient-x">
        <span className="block h-full w-full rounded-lg
          bg-gradient-to-br from-blue-950/90 via-teal-900/80 to-emerald-900/80">
        </span>
      </span>

            {/* Content */}
            <span className="relative flex items-center text-gray-100 font-semibold">
        <ArrowLeft className="w-4 h-4 mr-2" />
                {label}
      </span>
        </button>
    );
}
