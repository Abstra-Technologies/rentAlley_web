'use client'
import {useRouter, useSearchParams} from "next/navigation";
import {Suspense, useEffect, useState} from "react";
import axios from "axios";

export default function SecFailedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SecFailed />
        </Suspense>
    );
}

function SecFailed() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const agreement_id = searchParams.get("agreement_id");
    const payment_type = searchParams.get("payment_type");
    const amount = searchParams.get("amount");
    const requestReferenceNumber = searchParams.get("requestReferenceNumber");

    const [message, setMessage] = useState("Processing your payment...");
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function updateLeaseStatus() {
            if (!agreement_id || !payment_type || !amount  || !requestReferenceNumber) {
                console.warn(" Missing required payment details. Waiting...");
                return;
            }
            try {
                console.log("Updating lease status with:", {
                    agreement_id, payment_type, amount, requestReferenceNumber
                });

                // Update Lease Agreement Payment Status
                await axios.post("/api/payment/update-lease-cancelSecAdv", {
                    agreement_id,
                    payment_type,
                    amount,
                    requestReferenceNumber,

                });

                setMessage("Your Cancellation was successful!");
            } catch (error) {
                setMessage("Failed to update payment status.");
                console.error(" Error updating lease agreement:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id && payment_type && amount  && requestReferenceNumber) {
            updateLeaseStatus();
        }
    }, [agreement_id, payment_type, amount, requestReferenceNumber]);

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg text-center">
            <h2 className={`text-2xl font-semibold mb-4 ${loading ? "text-yellow-600" : "text-green-600"}`}>
                {loading ? "Processing..." : "Payment Successful"}
            </h2>
            <p>{message}</p>

            {!loading && (
                <div className="mt-4 p-4 border rounded bg-gray-100">
                    <h2>Payment Cancellation Successful.</h2>
                </div>
            )}

            <button
                onClick={() => router.push("/pages/tenant/my-unit")}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Go to Dashboard
            </button>
        </div>
    );
}