"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { Suspense } from "react";
import useAuthStore from "@/zustand/authStore"; // ensure this path is correct

function SubscriptionReview() {
    const router = useRouter();
    const params = useSearchParams();
    const { user } = useAuthStore(); // get logged-in user

    // Extract params
    const planId = params.get("planId");
    const planName = params.get("planName");
    const amountToCharge = Number(params.get("amount") || 0);

    // Find selected plan
    const selectedPlan = SUBSCRIPTION_PLANS.find(
        (p) => String(p.id) === String(planId)
    );

    // Guard invalid requests
    if (!planId || !selectedPlan || amountToCharge <= 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Invalid subscription request.</p>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        onClick={() => router.push("/pages/landlord/subscription")}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    /** PAY WITH MAYA — UPDATED STRUCTURE */
    const goToPayment = async () => {
        try {
            const response = await axios.post("/api/payment/checkout-payment", {
                amount: amountToCharge,
                description: selectedPlan.name,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                landlord_id: user.landlord_id,
                plan_name: selectedPlan.name,
                redirectUrl: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/subscriptionSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/failure`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/cancelled`,
                },
            });

            if (response.data?.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                alert("Payment Error: No checkout URL received.");
            }
        } catch (err) {
            alert("Unable to start Maya payment.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">

                {/* BACK BUTTON */}
                <button
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </button>

                {/* TITLE */}
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">
                    Review Your Subscription
                </h1>

                <p className="text-gray-600 text-center mb-8">
                    Confirm your plan and continue to payment.
                </p>

                {/* REVIEW BOX */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                        {selectedPlan.name}
                    </h2>

                    <div className="space-y-3 text-gray-700">
                        <p className="flex justify-between">
                            <span>Base Price:</span>
                            <span className="font-semibold">₱{selectedPlan.price}</span>
                        </p>

                        <hr className="my-3" />

                        <p className="flex justify-between text-lg font-bold text-gray-900">
                            <span>Total Amount Due:</span>
                            <span>₱{amountToCharge}</span>
                        </p>
                    </div>
                </div>

                {/* PAY WITH MAYA */}
                <button
                    onClick={goToPayment}
                    className="
                        w-full h-[48px] flex items-center justify-center gap-2
                        rounded-lg text-white font-semibold
                        bg-gradient-to-r from-green-600 to-green-700
                        hover:from-green-700 hover:to-green-800
                        transition-all shadow-md hover:shadow-lg
                    "
                >
                    <img src="/maya-logo.svg" alt="Maya" className="h-6" />
                    Pay with Maya
                </button>

            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading subscription…</div>}>
            <SubscriptionReview />
        </Suspense>
    );
}
