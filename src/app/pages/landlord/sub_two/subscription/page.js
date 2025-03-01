"use client";

import { useState, useEffect } from "react";
import useAuth from "../../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import CardWarning from "../../../../../components/devTeam";
import {logEvent} from "../../../../../utils/gtag";
import LoadingScreen from "../../../../../components/loadingScreen";

// modify this part.
const plans = [
    { id: 1, name: "Free Plan", price: 0, trialDays: 0, features: ["1 Property", "2 Property Listings", "5 Maintenance Requests / month", "Up to 3 Prospective Tenants", "Up to 2 Property Billing", "Mobile Access"] },
    { id: 2, name: "Standard Plan", price: 500, trialDays: 1, features: ["List 5 Properties",] },
    { id: 3, name: "Premium Plan", price: 1000, trialDays: 1, features: ["Unlimited Listings", ] },
];

export default function SubscriptionPlans() {
    const { user } = useAuth();
    const router = useRouter();
    const [processing, setProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [trialUsed, setTrialUsed] = useState(null);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [proratedAmount, setProratedAmount] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);

    // useEffect(() => {
    //     async function checkTrialStatus() {
    //         if (!user) return;
    //         try {
    //             setDataLoading(true);
    //             const response = await fetch("/api/payment/stats", {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({ landlord_id: user.landlord_id }),
    //             });
    //             const data = await response.json();
    //             setTrialUsed(data.is_trial_used);
    //         } catch (error) {
    //             console.error("Error checking trial status:", error);
    //         } finally {
    //             setDataLoading(false);
    //         }
    //     }
    //     if (user) checkTrialStatus();
    // }, [user]);
    //
    // useEffect(() => {
    //     async function fetchCurrentSubscription() {
    //         if (!user) return;
    //         setDataLoading(true);
    //
    //         try {
    //             const response = await fetch(`/api/landlord/subscription/${user.landlord_id}`);
    //             if (!response.ok) throw new Error("No active subscription found.");
    //
    //             const data = await response.json();
    //             setCurrentSubscription(data);
    //         } catch (error) {
    //             console.error("Error fetching current subscription:", error);
    //             setCurrentSubscription(null);
    //         }finally {
    //             setDataLoading(false);
    //
    //         }
    //     }
    //     if (user) fetchCurrentSubscription();
    // }, [user]);


    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setDataLoading(true); // ✅ Start loading

            try {
                const trialResponse = await fetch("/api/payment/stats", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ landlord_id: user.landlord_id }),
                });

                const trialData = await trialResponse.json();
                setTrialUsed(trialData.is_trial_used);

                // **Fetch Current Subscription**
                const subscriptionResponse = await fetch(`/api/landlord/subscription/${user.landlord_id}`);

                if (!subscriptionResponse.ok) throw new Error("No active subscription found.");

                const subscriptionData = await subscriptionResponse.json();
                setCurrentSubscription(subscriptionData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setCurrentSubscription(null); // Ensure null state if no subscription exists
            } finally {
                setDataLoading(false); // ✅ Stop loading
            }
        }

        if (user) fetchData();
    }, [user]);


    const calculateProrate = (newPlan) => {
        if (!currentSubscription) return 0;

        const currentPlan = plans.find((p) => p.name === currentSubscription.plan_name);
        if (!currentPlan || currentPlan.id === newPlan.id) return 0; // No prorate if same plan

        const totalDays = 30; //  monthly billing
        const remainingDays = Math.max(0, (new Date(currentSubscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));

        const dailyRateCurrent = currentPlan.price / totalDays;
        const dailyRateNew = newPlan.price / totalDays;

        const unusedAmount = dailyRateCurrent * remainingDays;
        const newCharge = newPlan.price - unusedAmount;

        return Math.max(newCharge, 0); // Ensure no negative charge
    };

    const handleSelectPlan = (plan) => {
        if (currentSubscription?.plan_name === plan.name) return; // Prevent selecting current plan
        setSelectedPlan(plan);
        const proratedCost = calculateProrate(plan);
        setProratedAmount(parseFloat(proratedCost.toFixed(2)));
    };

    const handleProceed = async () => {
        if (!selectedPlan) {
            alert("Please select a plan to proceed.");
            return;
        }

        setProcessing(true);

        try {
            if (selectedPlan.id === 1) {
                // Free Plan logic
                const response = await fetch("/api/payment/stats", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        landlord_id: user.landlord_id,
                        plan_name: selectedPlan.name,
                        is_free_plan: true
                    }),
                });

                if (response.status === 201) {
                    alert("Free Plan activated successfully!");
                    router.push("/pages/landlord/dashboard");
                } else {
                    alert("Failed to activate Free Plan.");
                }
            } else if (!trialUsed && selectedPlan.trialDays > 0) {
                // Start free trial
                const response = await fetch("/api/payment/stats", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        landlord_id: user.landlord_id,
                        plan_name: selectedPlan.name,
                    }),
                });
                if (response.status === 201) {
                    alert(`${selectedPlan.trialDays}-day free trial activated successfully!`);
                    router.push("/pages/landlord/dashboard");
                } else {
                    alert("Failed to activate free trial.");
                }
            } else {
                // Determine the amount for checkout
                let amountToCharge;

                if (!currentSubscription && trialUsed) {
                    // If there's NO current plan and the free trial is used, charge full price
                    amountToCharge = selectedPlan.price;
                } else {
                    // If there IS a current plan, apply proration
                    amountToCharge = proratedAmount;
                }

                // Proceed to checkout
                router.push(
                    `/pages/landlord/subscription/checkout?planId=${selectedPlan.id}&plan=${encodeURIComponent(selectedPlan.name)}&amount=${amountToCharge}&trialDays=${selectedPlan.trialDays}`
                );
            }
        } catch (error) {
            alert("An error occurred. Please try again.", error);
        } finally {
            setProcessing(false);
        }
    };

    if (dataLoading) return <LoadingScreen />;
    if (!user) return;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <CardWarning />
            <h1 className="text-3xl font-bold mb-6">Choose Your Subscription Plan</h1>
            <p><strong>Trial Used:</strong> {trialUsed ? "Yes" : "No"}</p>
            <p>
                <strong>Current Subscription:</strong> {currentSubscription?.plan_name || "None"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrentPlan = currentSubscription?.plan_name === plan.name;
                    return (
                        <div
                            key={plan.id}
                            className={`p-6 border rounded-lg shadow cursor-pointer ${
                                isCurrentPlan
                                    ? "opacity-50 cursor-not-allowed border-gray-500"
                                    : selectedPlan?.id === plan.id
                                        ? "border-blue-600 shadow-md"
                                        : "border-gray-300"
                            }`}
                            onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                        >
                            <h2 className="text-xl font-bold">{plan.name}</h2>
                            <p className="text-lg text-gray-700">₱{plan.price}/month</p>
                            <p className="text-sm text-green-600">
                                {plan.trialDays > 0 ? `${plan.trialDays}-day free trial` : "No trial available"}
                            </p>
                            <ul className="mt-4 space-y-2">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">✅ {feature}</li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {selectedPlan && !trialUsed && currentSubscription && (
                <div className="p-4 bg-blue-100 text-blue-900 border-l-4 border-blue-500 mb-4">
                    <strong>💰 Prorate Discount:</strong> Your total payable amount will be ₱{proratedAmount.toFixed(2)} after deducting unused days from your current plan.
                </div>
            )}

            <div className="text-center mt-6">
                <button
                    className={`px-6 py-2 rounded-md ${
                        !selectedPlan ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    disabled={!selectedPlan || processing}
                    onClick={handleProceed}
                >
                    {processing
                        ? "Processing..."
                        : selectedPlan?.id === 1
                            ? "Start Free Plan"
                            : trialUsed
                                ? "Proceed to Payment"
                                : `Start ${selectedPlan?.trialDays}-Day Free Trial`}
                </button>
            </div>
        </div>
    );
}
