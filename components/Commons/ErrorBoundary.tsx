"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
    error: string;
    onRetry: () => void;
}

export default function ErrorBoundary({ error, onRetry }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Something went wrong
            </h3>
            <p className="text-gray-600 text-center mb-4 max-w-md">{error}</p>
            <button
                onClick={onRetry}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
                Try Again
            </button>
        </div>
    );
}
