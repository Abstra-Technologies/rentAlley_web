"use client";

import GooglePayButton from "@google-pay/button-react";
import { useSearchParams, useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import { ArrowLeft } from "lucide-react";
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

    // visual constants for matching buttons
    const BUTTON_HEIGHT = "48px";
    const BUTTON_RADIUS = "0.5rem";

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

    /**
     * Google Pay handler using the React component's onLoadPaymentData
     * - This function receives the paymentData object directly from the button.
     * - We extract tokenizationData.token and send to backend for charging.
     */
    const handleGooglePayLoad = async (paymentData: any) => {
        try {
            // token returned by google pay
            const token = paymentData?.paymentMethodData?.tokenizationData?.token;

            if (!token) {
                console.error("No token in paymentData", paymentData);
                alert("Failed to get payment token from Google Pay.");
                return;
            }

            // Send token to your backend to process the payment
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

            if (res.ok && data?.success) {
                router.push("/pages/payment/subscriptionSuccess");
            } else {
                console.error("Google Pay backend error", data);
                router.push("/pages/payment/subscriptionFailed");
            }
        } catch (err) {
            console.error("Google Pay handling error:", err);
            alert("There was an error processing Google Pay. Please try again.");
        }
    };

    // Maya / other direct checkout
    const goToPayment = async (method: string) => {
        if (method === "googlepay") {
            // The GooglePayButton will handle showing the sheet; do nothing here.
            return;
        }

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
                window.location.href = response.data.checkoutUrl;
            } else {
                console.error("No checkoutUrl", response.data);
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


                <GooglePayButton
                    environment="TEST"
                    buttonColor="black"
                    buttonType="pay"
                    buttonRadius="4"
                    buttonBorderType="default_border"
                    buttonLocale="en"
                    buttonSizeMode="fill"
                    style={{width: 500, height: 50}}
                    paymentRequest={{
                            merchantInfo: {
                                merchantName: "Upkyp Subscription",
                            },
                    }}
                />


                {/*<GooglePayButton*/}
                {/*    environment="TEST"*/}
                {/*    buttonColor="black"*/}
                {/*    buttonType="pay"*/}
                {/*    style={{width: 700, height: 50}}*/}
                {/*    paymentRequest={{*/}
                {/*        apiVersion: 2,*/}
                {/*        apiVersionMinor: 0,*/}
                {/*        allowedPaymentMethods: [*/}
                {/*            {*/}
                {/*                type: "CARD",*/}
                {/*                parameters: {*/}
                {/*                    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],*/}
                {/*                    allowedCardNetworks: ["VISA", "MASTERCARD"],*/}
                {/*                },*/}
                {/*                tokenizationSpecification: {*/}
                {/*                    type: "PAYMENT_GATEWAY",*/}
                {/*                    parameters: {*/}
                {/*                        gateway: "example", // replace with your gateway like 'stripe' in prod*/}
                {/*                        gatewayMerchantId: "example_merchant_id",*/}
                {/*                    },*/}
                {/*                },*/}
                {/*            },*/}
                {/*        ],*/}
                {/*        merchantInfo: {*/}
                {/*            merchantName: "Upkyp Subscription",*/}
                {/*        },*/}
                {/*        transactionInfo: {*/}
                {/*            totalPriceStatus: "FINAL",*/}
                {/*            totalPrice: String(amount),*/}
                {/*            currencyCode: "PHP",*/}
                {/*            countryCode: "PH",*/}
                {/*        },*/}
                {/*    }}*/}
                {/*    onLoadPaymentData={(paymentData) => {*/}
                {/*        // this receives paymentData directly*/}
                {/*        handleGooglePayLoad(paymentData);*/}
                {/*    }}*/}
                {/*/>*/}

                {/* Payment Options */}
                <div className="mt-10 space-y-4">

                    {/* PAY WITH MAYA */}
                    <button
                        onClick={() => goToPayment("maya")}
                        className="
              w-full h-[48px] flex items-center justify-center gap-2
              rounded-lg text-white font-semibold
              bg-gradient-to-r from-green-600 to-green-700
              hover:from-green-700 hover:to-green-800
              transition-all shadow-md hover:shadow-lg
            "
                        style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
                    >
                        <img src="/maya-logo.svg" alt="Maya" className="h-6" />
                        Pay with Maya
                    </button>

                    {/* PAY WITH GOOGLE PAY - wrapper that forces size + rounded corners */}


                </div>
            </div>

            {/* Helpful: an uploaded screenshot (for reference in the editor) */}
            {/* image path: /mnt/data/26908012-bbb7-4214-b67c-1175a1d6a5ad.png */}
        </div>
    );
}
