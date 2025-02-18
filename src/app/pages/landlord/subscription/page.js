// "use client";
//
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import useAuth from "../../../../../hooks/useSession";
//
// const plans = [
//     {
//         id: 1,
//         name: "Basic",
//         price: 0, // Numeric value for proper calculations
//         trialDays: 7,
//         features: ["List 1 Property", "Basic Support", "No Payment Required"],
//     },
//     {
//         id: 2,
//         name: "Standard",
//         price: 500,
//         trialDays: 10,
//         features: ["List 5 Properties", "Priority Support", "Auto-renews after trial"],
//     },
//     {
//         id: 3,
//         name: "Premium",
//         price: 1000,
//         trialDays: 14,
//         features: ["Unlimited Listings", "24/7 Support", "Premium Exposure"],
//     },
// ];
//
// export default function SubscriptionPlans() {
//     const [selectedPlan, setSelectedPlan] = useState(null);
//     const router = useRouter();
//     const { user, isLoading } = useAuth(); // 🔥 Use the authentication hook
//
//
//     const handleSelectPlan = (plan) => {
//         setSelectedPlan(plan);
//     };
//
//     const handleProceed = () => {
//         if (selectedPlan) {
//             // Pass ID, Name, and Price as query parameters
//             router.push(`/pages/landlord/subscription/checkout?planId=${selectedPlan.id}&plan=${encodeURIComponent(selectedPlan.name)}&amount=${selectedPlan.price}&trialDays=${selectedPlan.trialDays}`);
//         }
//     };
//
//
//
//     return (
//         <div className="max-w-4xl mx-auto p-6">
//             <h1 className="text-3xl font-bold text-center mb-6">Choose Your Plan</h1>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {plans.map((plan) => (
//                     <div
//                         key={plan.id}
//                         className={`p-6 border rounded-xl shadow-lg cursor-pointer transition ${
//                             selectedPlan?.id === plan.id ? "border-violet-600 shadow-xl" : "border-gray-300"
//                         }`}
//                         onClick={() => handleSelectPlan(plan)}
//                     >
//                         <h2 className="text-xl font-semibold text-center">{plan.name}</h2>
//                         <p className="text-center text-gray-600">₱{plan.price}/month</p>
//                         <p className="text-center text-green-600">Free {plan.trialDays}-day trial</p>
//                         <ul className="mt-4 space-y-2">
//                             {plan.features.map((feature, index) => (
//                                 <li key={index} className="flex items-center gap-2">
//                                     ✅ {feature}
//                                 </li>
//                             ))}
//                         </ul>
//                     </div>
//                 ))}
//             </div>
//             <div className="text-center mt-6">
//                 <button
//                     className="bg-violet-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
//                     disabled={!selectedPlan}
//                     onClick={handleProceed}
//                 >
//                     Proceed to Payment
//                 </button>
//             </div>
//         </div>
//     );
// }
//

// "use client";
//
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import useAuth from "../../../../../hooks/useSession"; // 🔥 Use auth to get landlord details
//
// const plans = [
//     { id: 1, name: "Basic", price: 0, trialDays: 7, features: ["List 1 Property", "Basic Support", "No Payment Required"] },
//     { id: 2, name: "Standard", price: 500, trialDays: 10, features: ["List 5 Properties", "Priority Support", "Auto-renews after trial"] },
//     { id: 3, name: "Premium", price: 1000, trialDays: 14, features: ["Unlimited Listings", "24/7 Support", "Premium Exposure"] },
// ];
//
// export default function SubscriptionPlans() {
//     const { user, loading } = useAuth(); // 🔥 Get landlord details
//     const router = useRouter();
//     const [selectedPlan, setSelectedPlan] = useState(null);
//
//     if (loading) return <p className="text-center py-10">Loading...</p>;
//     if (!user) {
//         router.push("/pages/auth/admin_login"); // 🔥 Redirect to admin_login if not authenticated
//         return null;
//     }
//
//     const handleSelectPlan = (plan) => {
//         setSelectedPlan(plan);
//     };
//
//     const handleProceed = () => {
//         if (selectedPlan) {
//             router.push(`/pages/landlord/subscription/checkout?planId=${selectedPlan.id}&plan=${encodeURIComponent(selectedPlan.name)}&amount=${selectedPlan.price}`);
//         }
//     };
//
//     return (
//         <div className="max-w-4xl mx-auto p-6">
//             {user.landlord_id}
//
//
//
//             <h1 className="text-3xl font-bold text-center mb-6">Choose Your Plan</h1>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {plans.map((plan) => (
//                     <div
//                         key={plan.id}
//                         className={`p-6 border rounded-xl shadow-lg cursor-pointer transition ${selectedPlan?.id === plan.id ? "border-violet-600 shadow-xl" : "border-gray-300"}`}
//                         onClick={() => handleSelectPlan(plan)}
//                     >
//                         <h2 className="text-xl font-semibold text-center">{plan.name}</h2>
//                         <p className="text-center text-gray-600">₱{plan.price}/month</p>
//                         <p className="text-center text-green-600">Free {plan.trialDays}-day trial</p>
//                         <ul className="mt-4 space-y-2">
//                             {plan.features.map((feature, index) => (
//                                 <li key={index} className="flex items-center gap-2">✅ {feature}</li>
//                             ))}
//                         </ul>
//                     </div>
//                 ))}
//             </div>
//             <div className="text-center mt-6">
//                 <button
//                     className="bg-violet-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
//                     disabled={!selectedPlan}
//                     onClick={handleProceed}
//                 >
//                     Proceed to Payment
//                 </button>
//             </div>
//         </div>
//     );
// }

"use client";

import { useState } from "react";
import  useAuth  from "../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import CardWarning from "../../../../components/devTeam";

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

        if (selectedPlan.price === 0) {
            // Free plan: Activate immediately
            setProcessing(true);
            try {
                const response = await fetch("/api/payment/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        landlord_id: user.landlord_id,
                        plan_name: selectedPlan.name,
                        amount: 0,
                        trialDays: 0,
                    }),
                });

                const data = await response.json();
                if (response.status === 201) {
                    alert("Free plan activated successfully!");
                    router.push("/pages/landlord/dashboard");
                } else {
                    console.error("Error activating free plan:", data.error);
                    alert("Failed to activate free plan.");
                }
            } catch (error) {
                console.error("Error activating free plan:", error);
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
            <CardWarning/>
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
                    className="bg-blue-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
                    disabled={!selectedPlan || processing}
                    onClick={handleProceed}
                >
                    {processing ? "Processing..." : "Proceed"}
                </button>
            </div>
        </div>
    );
}
