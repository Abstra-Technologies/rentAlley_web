// "use client";
//
// import { useSearchParams, useRouter } from "next/navigation";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import useAuth from "../../../../../../hooks/useSession"; // 🔥 Use your custom auth hook
//
// export default function CheckoutPage() {
//     const searchParams = useSearchParams();
//     const router = useRouter();
//     const { user, loading, error } = useAuth();
//     const [processing, setProcessing] = useState(false);
//
//     const planId = searchParams.get("planId");
//     const planName = searchParams.get("plan");
//     const amount = searchParams.get("amount");
//
//     useEffect(() => {
//         if (!loading && (!user || error)) {
//             router.push("/pages/auth/login");
//         }
//         if (!planId || !planName || !amount) {
//             router.push("/pages/landlord/subscription");
//         }
//     }, [user, loading, error, planId, planName, amount, router]);
//
//     const handleCheckout = async () => {
//         setProcessing(true);
//         try {
//             const response = await axios.post("/api/payment/checkout", {
//                 landlord_id: user.landlord_id,
//                 plan_name: planName,
//                 amount: Number(amount),
//                 trialDays: planName === "Standard" ? 10 : 14,
//                 redirectUrl: {
//                     success: "http://localhost:3000/pages/payment/success",
//                     failure: "http://localhost:3000/pages/payment/failure",
//                     cancel: "http://localhost:3000/pages/payment/cancelled",
//                 },
//             });
//
//             if (response.data.checkoutUrl) {
//                 window.location.href = response.data.checkoutUrl; // Redirect to Maya payment page
//             } else {
//                 alert("Failed to retrieve payment URL.");
//             }
//         } catch (error) {
//             console.error("Error initiating payment:", error);
//             alert("Payment failed. Please try again.");
//         }
//         setProcessing(false);
//     };
//
//     if (loading) return <div>Loading...</div>;
//
//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
//             <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
//                 <h1 className="text-2xl font-bold text-blue-600 mb-4">Checkout</h1>
//                 <p className="text-gray-700 mb-4">You are subscribing to: <strong>{planName}</strong></p>
//                 <p className="text-gray-700 mb-2">Total: ₱{amount}</p>
//                 <button
//                     onClick={handleCheckout}
//                     disabled={processing}
//                     className={`px-4 py-2 rounded-md text-white ${processing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
//                 >
//                     {processing ? "Processing..." : "Pay Now"}
//                 </button>
//             </div>
//         </div>
//     );
// }

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import useAuth from "../../../../../../hooks/useSession"; // 🔥 Use your custom auth hook

// ✅ Move useSearchParams() inside a Suspense-wrapped component
const SearchParamsWrapper = ({ setPlanId, setPlanName, setAmount }) => {
    const searchParams = useSearchParams();
    const planId = searchParams.get("planId");
    const planName = searchParams.get("plan");
    const amount = searchParams.get("amount");

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
            router.push("/pages/auth/login");
        }
        if (!planId || !planName || !amount) {
            router.push("/pages/landlord/subscription");
        }
    }, [user, loading, error, planId, planName, amount, router]);

    const handleCheckout = async () => {
        setProcessing(true);
        try {
            const response = await axios.post("/api/payment/checkout", {
                landlord_id: user.landlord_id,
                plan_name: planName,
                amount: Number(amount),
                trialDays: planName === "Standard" ? 10 : 14,
                redirectUrl: {
                    success: "http://localhost:3000/pages/payment/success",
                    failure: "http://localhost:3000/pages/payment/failure",
                    cancel: "http://localhost:3000/pages/payment/cancelled",
                },
            });

            if (response.data.checkoutUrl) {
                window.location.href = response.data.checkoutUrl; // Redirect to Maya payment page
            } else {
                alert("Failed to retrieve payment URL.");
            }
        } catch (error) {
            console.error("Error initiating payment:", error);
            alert("Payment failed. Please try again.");
        }
        setProcessing(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <Suspense fallback={<div>Loading Checkout...</div>}>
            <SearchParamsWrapper setPlanId={setPlanId} setPlanName={setPlanName} setAmount={setAmount} />
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
                <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-blue-600 mb-4">Checkout</h1>
                    <p className="text-gray-700 mb-4">You are subscribing to: <strong>{planName}</strong></p>
                    <p className="text-gray-700 mb-2">Total: ₱{amount}</p>
                    <button
                        onClick={handleCheckout}
                        disabled={processing}
                        className={`px-4 py-2 rounded-md text-white ${processing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {processing ? "Processing..." : "Pay Now"}
                    </button>
                </div>
            </div>
        </Suspense>
    );
}
