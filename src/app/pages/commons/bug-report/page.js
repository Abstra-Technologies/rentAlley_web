"use client";

import Link from "next/link";
import useAuth from "../../../../../hooks/useSession";
import BugReportForm from "../../../../components/modules/bugreport";


export default function TenantDashboard() {
    const { user, loading, error, signOut } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <p>You need to log in to access the dashboard.</p>;
    }

    console.log("User Data ", user);

    return (
        <div>
            <h4>User ID: {user.userID}</h4>
            <BugReportForm userID={user.userID} />
            {/* Sign Out Button */}
            <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md ml-4"
            >
                Sign Out
            </button>

            {/* Additional content can go here */}
        </div>
    );
}
