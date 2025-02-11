"use client";

// import useAuth from "../../../../../hooks/useSession";
//
// export default function LandlordDashboard() {
//   const { user, loading, error, signOut } = useAuth();
//
//   if (loading) {
//     return <p>Loading...</p>;
//   }
//
//   if (error) {
//     return <p>{error}</p>;
//   }
//
//   if (!user) {
//     return <p>You need to log in to access the dashboard.</p>;
//   }
//
//   console.log("User Data ", user);
//     const hasSubscription = user?.subscription && user.subscription.id;
//   return (
//       <div>
//           <h1>
//               Welcome, {user.firstName} {user.lastName}!
//           </h1>
//           <p>Your user type is: {user.userType}</p>
//           <p>Landlord ID: {user.landlord_id}</p>
//           <p>Your Subcription ID: {user.subscription.id || "No Subscription"} </p>
//           {!hasSubscription && (
//               <button
//                   onClick={() => router.push('/subscription')}
//                   className="px-4 py-2 bg-blue-500 text-white rounded-md"
//               >
//                   Subscribe Now
//               </button>
//           )}
//           {/* Sign Out Button */}
//           <button
//               onClick={signOut}
//               className="bg-red-500 text-white px-4 py-2 rounded-md ml-4"
//           >
//               Sign Out
//           </button>
//           {/* Additional content can go here */}
//       </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import useAuth from "../../../../../hooks/useSession";
import axios from "axios";
import {useRouter} from "next/navigation";

export default function LandlordDashboard() {
    const { user, loading, error } = useAuth(); // Get user session
const router = useRouter();

    // useEffect(() => {
    //     if (user && user.userType === "landlord" && user.landlord_id) {
    //         fetchSubscription(user.landlord_id);
    //     }
    // }, [user]);

    if (loading) return <p>Loading user data...</p>;
    if (error) return <p>Error loading user session: {error}</p>;


    const subscription = user.subscription;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Landlord Dashboard</h1>

            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User Type:</strong> {user.userType}</p>
            <p><strong>ID:</strong> {user.landlord_id}</p>




            {/* Display Subscription Details */}
            <h2 className="text-xl font-bold mt-4">Subscription Details</h2>
            {subscription ? (
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-xl font-semibold text-blue-600">Your Subscription</h2>
                    <p><strong>Subscription ID:</strong> {subscription.subscription_id}</p>
                    <p><strong>Plan Name:</strong> {subscription.plan_name}</p>
                    <p><strong>Status:</strong> {subscription.status}</p>
                    <p><strong>Start Date:</strong> {subscription.start_date}</p>
                    <p><strong>End Date:</strong> {subscription.end_date}</p>
                    <p><strong>Payment Status:</strong> {subscription.payment_status}</p>
                </div>
            ) : (
                <p>No active subscription found.</p>
            )}
        </div>
    );
}
