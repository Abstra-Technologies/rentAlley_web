"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const SearchParamsWrapper = ({ setPaymentType, setAmount }) => {
    const searchParams = useSearchParams();
    const paymentType = searchParams.get("paymentType") || "Security Deposit";
    const amount = Number(searchParams.get("amount")) || 5000;

    useEffect(() => {
        setPaymentType(paymentType);
        setAmount(amount);
    }, [paymentType, amount, setPaymentType, setAmount]);

    return null;
};

export default function CheckoutPage() {
    const router = useRouter();

    // Dummy User Data (Replace with real user data when ready)
    const user = {
        tenant_id: "12345",
        firstName: "John",
        lastName: "Doe",
        email: "johndoe@example.com",
    };

    const [paymentType, setPaymentType] = useState(null);
    const [amount, setAmount] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleCheckout = async () => {
        if (!paymentType || !amount) {
            console.error("🚨 Error - Missing required checkout data");
            alert("Error: Missing required details.");
            return;
        }

        console.log("🔍 Debug - Checkout Data:", {
            paymentType,
            amount,
            tenantId: user.tenant_id,
            email: user.email,
        });

        setProcessing(true);

        // Simulating Payment Processing Delay
        setTimeout(() => {
            console.log("✅ Payment Successful! Redirecting...");
            alert("Payment successful! Redirecting to success page...");
            router.push("/pages/payment/success");
        }, 2000);
    };

    return (
        <Suspense fallback={<div>Loading Checkout...</div>}>
            <SearchParamsWrapper setPaymentType={setPaymentType} setAmount={setAmount} />
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
                <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-blue-600 mb-4">Checkout</h1>
                    {paymentType && amount !== null ? (
                        <>
                            <p className="text-gray-700 mb-4">
                                You are paying for: <strong>{paymentType}</strong>
                            </p>
                            <p className="text-gray-700 mb-2">Tenant ID: <strong>{user.tenant_id}</strong></p>
                            <p className="text-gray-700 mb-2">First Name: <strong>{user.firstName}</strong></p>
                            <p className="text-gray-700 mb-2">Last Name: <strong>{user.lastName}</strong></p>
                            <p className="text-gray-700 mb-2">Email: <strong>{user.email}</strong></p>
                            <p className="text-gray-900 font-semibold mb-4">Total: ₱{amount}</p>
                            <button
                                onClick={handleCheckout}
                                disabled={processing}
                                className={`px-4 py-2 rounded-md text-white ${processing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {processing ? "Processing..." : "Pay Now"}
                            </button>
                        </>
                    ) : (
                        <p className="text-red-500">No payment details found. Redirecting...</p>
                    )}
                    <button
                        onClick={() => router.push("/pages/tenant/payments")}
                        className="w-full mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </Suspense>
    );
}
