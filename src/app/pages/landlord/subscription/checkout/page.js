//
// "use client";
//
// import { useSearchParams, useRouter } from "next/navigation";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import useAuth from "../../../../../../hooks/useSession";
//
// export default function CheckoutPage() {
//     const searchParams = useSearchParams();
//     const router = useRouter();
//     const { user, loading, error } = useAuth();
//
//     const planId = searchParams.get("planId");
//     const planName = searchParams.get("plan");
//     const amount = Number(searchParams.get("amount"));
//
//     const firstName = user?.firstName;
//     const lastName = user?.lastName;
//     const landlordEmail = user?.email;
//     const landlordId = user?.landlord_id;
//
//     const [processing, setProcessing] = useState(false);
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
//     if (loading) {
//         return <div className="text-center py-10">Loading...</div>;
//     }
//
//     if (!user) {
//         return null;
//     }
//
//     const handleCheckout = async () => {
//         if (!planId || !planName || landlordId === undefined) {
//             console.error("🚨 Error - Missing required checkout data");
//             alert("Error: Missing required details.");
//             return;
//         }
//
//         console.log("🔍 Debug - Checkout Data:", {
//             planId,
//             planName,
//             amount,
//             landlordId,
//             landlordEmail,
//         });
//
//         setProcessing(true);
//
//         // Free plan handling
//         if (amount === 0) {
//             try {
//                 const response = await axios.post("/api/payment/checkout", {
//                     landlord_id: landlordId,
//                     plan_name: planName,
//                     amount: 0,
//                     trialDays: 0,
//                 });
//
//                 if (response.status === 201) {
//                     alert("Free plan activated successfully!");
//                     router.push("/pages/landlord/dashboard");
//                 } else {
//                     console.error("🚨 Error activating free plan:", response.data.error);
//                     alert("Failed to activate free plan. Please try again.");
//                 }
//             } catch (error) {
//                 console.error("🚨 Error activating free plan:", error);
//                 alert("An error occurred. Please try again.");
//             } finally {
//                 setProcessing(false);
//             }
//             return;
//         }
//
//         // Paid plan handling
//         try {
//             const response = await axios.post("/api/payment/checkout", {
//                 amount,
//                 description: planName,
//                 email: landlordEmail,
//                 firstName,
//                 lastName,
//                 landlord_id: landlordId,
//                 plan_name: planName,
//                 redirectUrl: {
//                     success: "http://localhost:3000/pages/payment/success",
//                     failure: "http://localhost:3000/pages/payment/failure",
//                     cancel: "http://localhost:3000/pages/payment/cancelled",
//                 },
//             });
//
//             console.log("✅ Debug - Checkout Response:", response.data);
//
//             if (response.data.checkoutUrl) {
//                 window.location.href = response.data.checkoutUrl; // Redirect to the payment gateway
//             } else {
//                 throw new Error("Checkout URL not received.");
//             }
//         } catch (error) {
//             console.error("🚨 Error initiating payment:", error.response?.data || error.message);
//             alert("Payment failed. Please try again.");
//         } finally {
//             setProcessing(false);
//         }
//     };
//
//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
//             <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
//                 <h1 className="text-2xl font-bold text-blue-600 mb-4">Checkout</h1>
//                 {planName && amount !== undefined ? (
//                     <>
//                         <p className="text-gray-700 mb-4">
//                             You are subscribing to: <strong>{planName}</strong>
//                         </p>
//                         <p className="text-gray-700 mb-2">Landlord ID: <strong>{landlordId}</strong></p>
//                         <p className="text-gray-700 mb-2">First Name: <strong>{firstName}</strong></p>
//                         <p className="text-gray-700 mb-2">Last Name: <strong>{lastName}</strong></p>
//                         <p className="text-gray-700 mb-2">Email: <strong>{landlordEmail}</strong></p>
//                         <p className="text-gray-900 font-semibold mb-4">Total: ₱{amount}</p>
//                         <button
//                             onClick={handleCheckout}
//                             disabled={processing}
//                             className={`px-4 py-2 rounded-md text-white ${processing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
//                         >
//                             {processing ? "Processing..." : amount === 0 ? "Activate Free Plan" : "Pay Now"}
//                         </button>
//                     </>
//                 ) : (
//                     <p className="text-red-500">No plan selected. Redirecting...</p>
//                 )}
//                 <button
//                     onClick={() => router.push("/pages/landlord/subscription")}
//                     className="w-full mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
//                 >
//                     Go Back
//                 </button>
//             </div>
//         </div>
//     );
// }

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import useAuth from "../../../../../../hooks/useSession";

// ✅ Move useSearchParams() inside a Suspense-wrapped component
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
            alert("Error: Missing required details.");
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
                    alert("Free plan activated successfully!");
                    router.push("/pages/landlord/dashboard");
                } else {
                    console.error("🚨 Error activating free plan:", response.data.error);
                    alert("Failed to activate free plan. Please try again.");
                }
            } catch (error) {
                console.error("Error activating free plan:", error);
                alert("An error occurred. Please try again.");
            } finally {
                setProcessing(false);
            }
            return;
        }

        // Paid plan handling
        try {
            const response = await axios.post("/api/payment/checkout", {
                amount,
                description: planName,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                landlord_id: user.landlord_id,
                plan_name: planName,
                redirectUrl: {
                    success: "http://localhost:3000/pages/payment/success",
                    failure: "http://localhost:3000/pages/payment/failure",
                    cancel: "http://localhost:3000/pages/payment/cancelled",
                },
            });

            console.log("✅ Debug - Checkout Response:", response.data);

            if (response.data.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                throw new Error("Checkout URL not received.");
            }
        } catch (error) {
            console.error("🚨 Error initiating payment:", error.response?.data || error.message);
            alert("Payment failed. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Suspense fallback={<div>Loading Checkout...</div>}>
            <SearchParamsWrapper setPlanId={setPlanId} setPlanName={setPlanName} setAmount={setAmount} />
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
                <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-blue-600 mb-4">Checkout</h1>
                    {planName && amount !== null ? (
                        <>
                            <p className="text-gray-700 mb-4">
                                You are subscribing to: <strong>{planName}</strong>
                            </p>
                            <p className="text-gray-700 mb-2">Landlord ID: <strong>{user.landlord_id}</strong></p>
                            <p className="text-gray-700 mb-2">First Name: <strong>{user.firstName}</strong></p>
                            <p className="text-gray-700 mb-2">Last Name: <strong>{user.lastName}</strong></p>
                            <p className="text-gray-700 mb-2">Email: <strong>{user.email}</strong></p>
                            <p className="text-gray-900 font-semibold mb-4">Total: ₱{amount}</p>
                            <button
                                onClick={handleCheckout}
                                disabled={processing}
                                className={`px-4 py-2 rounded-md text-white ${processing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {processing ? "Processing..." : amount === 0 ? "Activate Free Plan" : "Pay Now"}
                            </button>
                        </>
                    ) : (
                        <p className="text-red-500">No plan selected. Redirecting...</p>
                    )}
                    <button
                        onClick={() => router.push("/pages/landlord/subscription")}
                        className="w-full mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </Suspense>
    );
}
