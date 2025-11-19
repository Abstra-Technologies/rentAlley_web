//  const response = await axios.post("/api/payment/checkout-payment", payload);

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import axios from "axios";

export default function SubscriptionReview() {
    const router = useRouter();
    const params = useSearchParams();

    const planId = params.get("planId");
    const planName = params.get("planName");
    const amount = params.get("amount");
    const prorated = params.get("prorated") || "0";

    const selectedPlan = SUBSCRIPTION_PLANS.find(
        (p) => String(p.id) === String(planId)
    );

    // Load Google Pay script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://pay.google.com/gp/p/js/pay.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    if (!planId || !amount || !selectedPlan) {
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

    /* =====================================================
       GOOGLE PAY HANDLER
    ===================================================== */
    const onGooglePayClick = async () => {
        if (!window.google) {
            alert("Google Pay SDK not loaded. Please try again.");
            return;
        }

        const paymentsClient = new window.google.payments.api.PaymentsClient({
            environment: "TEST", // change to "PRODUCTION" later
        });

        const paymentRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [
                {
                    type: "CARD",
                    parameters: {
                        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                        allowedCardNetworks: ["VISA", "MASTERCARD"],
                    },
                    tokenizationSpecification: {
                        type: "PAYMENT_GATEWAY",
                        parameters: {
                            gateway: "example", // <-- REPLACE WITH: stripe | maya | adyen etc.
                            gatewayMerchantId: "example_merchant_id",
                        },
                    },
                },
            ],
            merchantInfo: {
                merchantName: "Upkyp Subscription",
            },
            transactionInfo: {
                totalPriceStatus: "FINAL",
                totalPrice: amount,
                currencyCode: "PHP",
                countryCode: "PH",
            },
        };

        try {
            // Show Google Pay popup
            const paymentData = await paymentsClient.loadPaymentData(paymentRequest);

            const token =
                paymentData.paymentMethodData.tokenizationData.token;

            // Send token to backend to charge
            const res = await fetch("/api/payment/googlepay-charge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    planName,
                    planId,
                    amount,
                    prorated,
                }),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/pages/payment/subscriptionSuccess");
            } else {
                router.push("/pages/payment/subscriptionFailed");
            }
        } catch (err) {
            console.error("Google Pay Error:", err);
            alert("Google Pay was cancelled or failed.");
        }
    };

    // Maya redirects normally
    const goToPayment = async (method: string) => {
        // GOOGLE PAY → popup first
        if (method === "googlepay") {
            return onGooglePayClick();
        }

        // MAYA → call API directly
        try {
            const payload = {
                method: "maya",
                amount,
                planId,
                planName,
                prorated,
                redirectUrl: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/subscriptionSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/subscriptionFailed`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/subscriptionCancelled`,
                },
            };

            const response = await axios.post("/api/payment/checkout-payment", payload);

            if (response.data?.checkoutUrl) {
                // Redirect straight to Maya Checkout
                window.location.href = response.data.checkoutUrl;
            } else {
                alert("Payment Error: No checkout URL received.");
            }
        } catch (err) {
            console.error("Maya Payment Error", err);
            alert("Maya payment could not be started.");
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">

                {/* Header */}
                <button
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </button>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">
                    Review Your Subscription
                </h1>

                <p className="text-gray-600 text-center mb-8">
                    Confirm your plan and choose your payment method.
                </p>

                {/* Review Box */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                        {selectedPlan.name}
                    </h2>

                    <div className="space-y-3 text-gray-700">
                        <p className="flex justify-between">
                            <span>Base Price:</span>
                            <span className="font-semibold">₱{selectedPlan.price}</span>
                        </p>

                        {Number(prorated) > 0 && (
                            <p className="flex justify-between text-green-700">
                                <span>Prorated Discount:</span>
                                <span className="font-semibold">-₱{prorated}</span>
                            </p>
                        )}

                        <hr className="my-3" />

                        <p className="flex justify-between text-lg font-bold text-gray-900">
                            <span>Total Amount Due:</span>
                            <span>₱{amount}</span>
                        </p>
                    </div>
                </div>

                {/* Payment Options */}
                <div className="mt-10 space-y-4">
                    {/* PAY WITH MAYA */}
                    <button
                        onClick={() => goToPayment("maya")}
                        className="
                            w-full py-3 rounded-lg text-white font-semibold
                            bg-gradient-to-r from-green-600 to-green-700
                            hover:from-green-700 hover:to-green-800
                            transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2
                        "
                    >
                        <img src="/maya-logo.svg" alt="Maya" className="h-6" />
                        Pay with Maya
                    </button>

                    {/* PAY WITH GOOGLE PAY */}
                    <button
                        onClick={onGooglePayClick}
                        className="
                            w-full py-3 rounded-xl font-semibold
                            bg-gradient-to-br from-black to-gray-900
                            text-white
                            flex items-center justify-center gap-3
                            shadow-lg hover:shadow-xl
                            border border-gray-700
                            hover:scale-[1.02] active:scale-[0.98]
                            transition-all duration-200
                            backdrop-blur-md
                        "
                    >
                        <img
                            src="https://res.cloudinary.com/dptmeluy0/image/upload/v1763527595/GPay_Acceptance_Mark_800_jhzrmj.png"
                            alt="Google Pay"
                            className="h-6"
                        />
                        <span className="tracking-wide">Google Pay</span>
                    </button>

                </div>
            </div>
        </div>
    );
}
