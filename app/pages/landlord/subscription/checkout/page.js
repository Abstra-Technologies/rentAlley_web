"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";

const SearchParamsWrapper = ({ setPlanId, setPlanName, setAmount }) => {
    const searchParams = useSearchParams();
    const planId = searchParams.get("planId");
    const planName = searchParams.get("plan");
    const amount = Number(searchParams.get("amount"));

    useEffect(() => {
        setPlanId(planId);
        setPlanName(planName);
        setAmount(amount);
    }, [planId, planName, amount, setPlanId, setPlanName, setAmount]);

    return null;
};

export default function CheckoutPage() {
    const router = useRouter();
    const { user, loading, error } = useAuth();

    const [planId, setPlanId] = useState(null);
    const [planName, setPlanName] = useState(null);
    const [amount, setAmount] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!loading && (!user || error)) {
        }

    }, [user, loading, error, planId, planName, amount, router]);

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    const handleCheckout = async () => {
        if (!planId || !planName || user.landlord_id === undefined) {
            console.error("Error - Missing required checkout data");
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Missing required details. Please check your selection and try again.",
              });
            return;
        }

        console.log("🔍 Debug - Checkout Data:", {
            planId,
            planName,
            amount,
            landlordId: user.landlord_id,
            landlordEmail: user.email,
        });

        setProcessing(true);

        // Free plan handling
        if (amount === 0) {
            try {
                const response = await axios.post("/api/payment/checkout", {
                    landlord_id: user.landlord_id,
                    plan_name: planName,
                    amount: 0,
                    trialDays: 0,
                });

                if (response.status === 201) {
                    Swal.fire({
                      icon: "success",
                      title: "Success!",
                      text: "Free plan activated successfully!",
                    }).then(() => {
                      router.push("/pages/landlord/dashboard");
                    });
                  } else {
                    console.error("🚨 Error activating free plan:", response.data.error);
                    Swal.fire({
                      icon: "error",
                      title: "Oops...",
                      text: "Failed to activate free plan. Please try again.",
                    });
                  }
                } catch (error) {
                    console.error("Error activating free plan:", error);
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "An error occurred. Please try again.",
                    });
                  } finally {
                    setProcessing(false);
                  }
            return;
        }

        try {
            const response = await axios.post("/api/payment/checkout-payment", {
                amount,
                description: planName,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                landlord_id: user.landlord_id,
                plan_name: planName,
                redirectUrl: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/success`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/failure`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/cancelled`,
                },

            });

            if (response.data.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                throw new Error("Checkout URL not received.");
            }
        } catch (error) {
            console.error("🚨 Error initiating payment:", error.response?.data || error.message);
            Swal.fire({
                icon: "error",
                title: "Payment Failed",
                text: "Payment failed. Please try again.",
              });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Suspense fallback={<div>Loading Checkout...</div>}>
            <SearchParamsWrapper
                setPlanId={setPlanId}
                setPlanName={setPlanName}
                setAmount={setAmount}
            />
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
                <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-gray-100">
                    {/* Header */}
                    <h1 className="text-3xl font-extrabold text-blue-600 mb-6">
                        Subscription Checkout
                    </h1>

                    {planName && amount !== null ? (
                        <>
                            <div className="space-y-3 mb-6 text-left">
                                <p className="text-gray-700">
                                    You are subscribing to:{" "}
                                    <span className="font-semibold text-gray-900">{planName}</span>
                                </p>

                                <p className="text-gray-700">
                                    First Name:{" "}
                                    <span className="font-medium text-gray-900">
                  {user.firstName}
                </span>
                                </p>
                                <p className="text-gray-700">
                                    Last Name:{" "}
                                    <span className="font-medium text-gray-900">
                  {user.lastName}
                </span>
                                </p>
                                <p className="text-gray-700">
                                    Email:{" "}
                                    <span className="font-medium text-gray-900">{user.email}</span>
                                </p>
                                <p className="text-lg font-bold text-blue-700 border-t pt-4">
                                    Total: ₱{amount}
                                </p>
                            </div>

                            {/* Primary button */}
                            <button
                                onClick={handleCheckout}
                                disabled={processing}
                                className={`w-full px-5 py-3 rounded-xl text-white font-semibold transition ${
                                    processing
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                                }`}
                            >
                                {processing
                                    ? "Processing..."
                                    : amount === 0
                                        ? "Activate Free Plan"
                                        : "Pay Now"}
                            </button>
                        </>
                    ) : (
                        <p className="text-red-500">No plan selected. Redirecting...</p>
                    )}

                    {/* Secondary button */}
                    <button
                        onClick={() => router.back()}
                        className="w-full mt-4 px-5 py-3 rounded-xl text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </Suspense>
    );

}
