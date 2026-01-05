"use client";

import { CheckCircle2, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Step5Success({
                                         leaseFileUrl,
                                     }: {
    leaseFileUrl: string;
}) {
    const router = useRouter();

    return (
        <div className="text-center p-6 max-w-lg mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />

            <h2 className="text-lg font-semibold mb-2">
                Lease Successfully Signed
            </h2>

            <p className="text-sm text-gray-600 mb-6">
                Your digital signature has been verified and recorded.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <a
                    href={leaseFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium"
                >
                    View Signed Lease
                </a>

                <button
                    onClick={() => router.push("/")}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50"
                >
                    <Home className="w-4 h-4" />
                    Back to Home
                </button>
            </div>
        </div>
    );
}
