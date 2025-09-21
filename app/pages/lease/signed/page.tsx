
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LeaseSignedPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // DocuSign appends query params like:
    // ?event=signing_complete&envelopeId=xxxx
    const event = searchParams.get("event");
    const envelopeId = searchParams.get("envelopeId");

    useEffect(() => {
        if (event === "signing_complete") {
            // ✅ handle post-signing actions
            console.log("Lease signed!", { envelopeId });

            // Example: call backend to mark lease as signed
            fetch("/api/leaseAgreement/markSigned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ envelopeId }),
            });
        }
    }, [event, envelopeId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="bg-white shadow-lg rounded-xl p-8 max-w-lg text-center">
                {event === "signing_complete" ? (
                    <>
                        <h1 className="text-2xl font-bold text-green-600 mb-4">
                            Lease Signed Successfully ✅
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Envelope ID: <span className="font-mono">{envelopeId}</span>
                        </p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Back to Dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            Signing Cancelled ❌
                        </h1>
                        <p className="text-gray-600 mb-6">
                            You exited the signing session before completing.
                        </p>
                        <button
                            onClick={() => router.push("/lease")}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
