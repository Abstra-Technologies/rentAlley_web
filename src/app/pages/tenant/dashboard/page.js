// "use client";
//
// import { useRouter } from "next/navigation";
// import useAuth from "../../../../../hooks/useSession";
// import ChatComponent from "../../../../components/modules/chat";
//
// export default function TenantDashboard() {
//     const { user, loading, error, signOut } = useAuth();
//     const router = useRouter();
//
//     if (loading) return <p>Loading...</p>;
//     if (error) return <p className="text-red-500">Error: {error}</p>;
//     if (!user) return <p>You need to log in to access the dashboard.</p>;
//
//     // Function to handle profile redirection
//     const handleViewProfile = () => {
//         if (!user || !user.user_id || !user.userType) {
//             alert("User session is invalid. Please log in again.");
//             router.push("/pages/auth/login");
//             return;
//         }
//
//         // Redirect user to their profile page dynamically
//         router.push(`/pages/${user.userType}/profile/${user.user_id}`);
//     };
//
//     return (
//         <div className="p-6">
//             <h1 className="text-xl font-semibold">Welcome, {user.firstName} {user.lastName}!</h1>
//             <p>Your user type: {user.userType} || ID: {user.user_id}</p>
//
//             {/* View Profile Button */}
//             <button
//                 onClick={handleViewProfile}
//                 className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-blue-600 transition duration-200"
//             >
//                 View Profile
//             </button>
//
//             {/* Chat Component */}
//             <ChatComponent user={user} />
//
//             {/* Sign Out Button */}
//             <button
//                 onClick={signOut}
//                 className="bg-red-500 text-white px-4 py-2 rounded-md mt-4 ml-4 hover:bg-red-600 transition duration-200"
//             >
//                 Sign Out
//             </button>
//         </div>
//     );
// }

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../../../../hooks/useSession";
import ChatComponent from "../../../../components/modules/chat";

export default function UserDashboard() {
    const { user, loading, error, signOut } = useAuth();
    const router = useRouter();

    // State to hold additional user details
    const [userDetails, setUserDetails] = useState(null);

    // ✅ Function to fetch user details (Modular for Future Use)
    const fetchUserDetails = useCallback(async () => {
        if (user) {
            try {
                const response = await fetch(`/api/user/details/${user.user_id}`);
                if (!response.ok) throw new Error("Failed to fetch user details");

                const data = await response.json();
                setUserDetails(data);
            } catch (err) {
                console.error("Error fetching user details:", err);
            }
        }
    }, [user]);

    // ✅ useEffect for handling multiple future functions
    useEffect(() => {
        if (user) {
            fetchUserDetails();
            // 🚀 Future functions can be added here!
        }
    }, [user, fetchUserDetails]); // Depend on `user` and `fetchUserDetails`

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!user) return <p>You need to log in to access the dashboard.</p>;

    // Function to handle profile redirection
    const handleViewProfile = () => {
        if (!user || !user.userType) {
            alert("User session is invalid. Please log in again.");
            router.push("/pages/auth/login");
            return;
        }

        // Redirect user to their profile page dynamically
        router.push(`/pages/${user.userType}/profile/${user.user_id}`);
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold">
                Welcome, {user.firstName} {user.lastName}!
            </h1>
            <p>User ID: {user.user_id}</p>

            {user.userType === "tenant" && userDetails?.tenant_id && (
                <p className="mt-2 text-gray-700">Tenant ID: {userDetails.tenant_id}</p>
            )}

            {/* View Profile Button */}
            <button
                onClick={handleViewProfile}
                className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-blue-600 transition duration-200"
            >
                View Profile
            </button>

            {/* Chat Component */}
            <ChatComponent user={user}/>



            {/* Sign Out Button */}
            <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md mt-4 ml-4 hover:bg-red-600 transition duration-200"
            >
                Sign Out
            </button>
        </div>
    );
}
