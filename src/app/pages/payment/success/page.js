// "use client";
//
// import { useEffect } from "react";
// import { useSearchParams } from "next/navigation";
// import axios from "axios";
//
// function PaymentSuccessPage() {
//     const searchParams = useSearchParams(); // ✅ Use this instead of `useRouter`
//     const requestReferenceNumber = searchParams.get("requestReferenceNumber");
//     const landlord_id = searchParams.get("landlord_id");
//
//     useEffect(() => {
//         async function updateSubscriptionStatus() {
//             if (!requestReferenceNumber || !landlord_id) {
//                 console.error("🚨 Missing requestReferenceNumber or landlord_id in URL.");
//                 return;
//             }
//
//             try {
//                 const response = await axios.post("/api/payment/status", {
//                     requestReferenceNumber,
//                     landlord_id, // ✅ Send landlord_id in the request body
//                 });
//
//                 console.log("✅ Subscription Updated:", response.data);
//             } catch (error) {
//                 console.error("🚨 Error updating subscription:", error.response?.data || error.message);
//             }
//         }
//
//         updateSubscriptionStatus();
//     }, [requestReferenceNumber, landlord_id]); // ✅ Run effect when params change
//
//     return (
//         <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
//             <h2 className="text-2xl font-semibold mb-4 text-green-600">✅ Payment Successful</h2>
//             <p>Your subscription has been activated successfully.</p>
//         </div>
//     );
// }
//
// export default PaymentSuccessPage;

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

// ✅ Move useSearchParams() inside a Suspense-wrapped component
const SearchParamsWrapper = ({ setRequestReferenceNumber, setLandlordId }) => {
    const searchParams = useSearchParams();
    const requestReferenceNumber = searchParams.get("requestReferenceNumber");
    const landlord_id = searchParams.get("landlord_id");

    useEffect(() => {
        setRequestReferenceNumber(requestReferenceNumber);
        setLandlordId(landlord_id);
    }, [requestReferenceNumber, landlord_id, setRequestReferenceNumber, setLandlordId]);

    return null;
};

function PaymentSuccessPage() {
    const [requestReferenceNumber, setRequestReferenceNumber] = useState(null);
    const [landlord_id, setLandlordId] = useState(null);

    useEffect(() => {
        async function updateSubscriptionStatus() {
            if (!requestReferenceNumber || !landlord_id) {
                console.error("🚨 Missing requestReferenceNumber or landlord_id in URL.");
                return;
            }

            try {
                const response = await axios.post("/api/payment/status", {
                    requestReferenceNumber,
                    landlord_id,
                });

                console.log("✅ Subscription Updated:", response.data);
            } catch (error) {
                console.error("🚨 Error updating subscription:", error.response?.data || error.message);
            }
        }

        updateSubscriptionStatus();
    }, [requestReferenceNumber, landlord_id]);

    return (
        <Suspense fallback={<div>Loading Payment Details...</div>}>
            <SearchParamsWrapper setRequestReferenceNumber={setRequestReferenceNumber} setLandlordId={setLandlordId} />
            <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-semibold mb-4 text-green-600">✅ Payment Successful</h2>
                <p>Your subscription has been activated successfully.</p>
            </div>
        </Suspense>
    );
}

export default PaymentSuccessPage;

