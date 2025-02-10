"use client";

import { useState, useEffect } from "react";
import useAuth from "../../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import CardWarning from "../../../../../components/devTeam";

const plans = [
    { id: 1, name: "Free Plan", price: 0, trialDays: 0, features: ["List 1 Property", "Basic Support"] },
    { id: 2, name: "Standard Plan", price: 500, trialDays: 10, features: ["List 5 Properties", "Priority Support"] },
    { id: 3, name: "Premium Plan", price: 1000, trialDays: 14, features: ["Unlimited Listings", "24/7 Support"] },
];

export default function SubscriptionPlans() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [processing, setProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [trialUsed, setTrialUsed] = useState(null); // Track trial usage status

    // check the landlord if  trial status
    useEffect(() => {
        async function checkTrialStatus() {
            if (!user) return;
            try {
                const response = await fetch("/api/payment/stats", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ landlord_id: user.landlord_id }),
                });

                const data = await response.json();
                setTrialUsed(data.is_trial_used); // ✅ Store trial status
            } catch (error) {
                console.error("Error checking trial status:", error);
            }
        }
        if (user) checkTrialStatus();
    }, [user]);

    if (loading) return <p>Loading...</p>;

    if (!user) {
        router.push("/pages/auth/login");
        return null;
    }

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
    };

    const handleProceed = async () => {
        if (!selectedPlan) {
            alert("Please select a plan to proceed.");
            return;
        }

        console.log(`🔍 Debug: Sending API request with landlord_id: ${user.landlord_id}, plan_name: ${selectedPlan.name}`);

        if (!trialUsed && selectedPlan.trialDays > 0) {
            setProcessing(true);
            try {
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
            } catch (error) {
                alert("An error occurred. Please try again.");
            } finally {
                setProcessing(false);
            }
            return;
        }

        router.push(
            `/pages/landlord/subscription/checkout?planId=${selectedPlan.id}&plan=${encodeURIComponent(
                selectedPlan.name
            )}&amount=${selectedPlan.price}&trialDays=${selectedPlan.trialDays}`
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <CardWarning />
            <h1 className="text-3xl font-bold mb-6">Choose Your Subscription Plan</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`p-6 border rounded-lg shadow cursor-pointer ${
                            selectedPlan?.id === plan.id ? "border-blue-600 shadow-md" : "border-gray-300"
                        }`}
                        onClick={() => handleSelectPlan(plan)}
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
                ))}
            </div>

            <div className="p-4 bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500 mb-4">
                <strong>🔔 Reminder:</strong> Free trials are only available once per landlord.
                If you have already used a free trial before, you must subscribe to a paid plan to continue.
                Upgrading or downgrading does not reset the free trial.
            </div>

            <div className="text-center mt-6">
                <button
                    className={`px-6 py-2 rounded-md ${
                        !selectedPlan
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    disabled={!selectedPlan || processing}
                    onClick={handleProceed}
                >
                    {processing ? "Processing..." : trialUsed ? "Proceed to Payment" : `Start ${selectedPlan?.trialDays}-Day Free Trial`}
                </button>
            </div>
        </div>
    );
}
