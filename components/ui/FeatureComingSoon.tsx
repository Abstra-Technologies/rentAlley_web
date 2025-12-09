// components/FeatureComingSoon.tsx
"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface FeatureComingSoonProps {
    featureName?: string;
    message?: string;
}

export default function FeatureComingSoon({
                                              featureName = "This feature",
                                              message = "is coming soon. Stay tuned!",
                                          }: FeatureComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md text-center">
            <div className="bg-yellow-100 p-4 rounded-full mb-4 animate-pulse">
                <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {featureName}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">{message}</p>
        </div>
    );
}
