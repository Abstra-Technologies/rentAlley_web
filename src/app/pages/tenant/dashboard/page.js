'use client'

import useAuth from "../../../../../hooks/useSession";

/**
 * TODO
 *  1. Design this dahsboard pn what need to be displayed.
 *  2.  Decrypt Data Here.
 *
 */
export default function TenantDashboard() {
    const { user, loading, error, signOut } = useAuth();
    if (loading) {
        return <p>Loading...</p>;  // Display loading message while verifying the token, change this if ever.
    }

    if (error) {
        return <p>{error}</p>;
    }
    // this is fpr if there is no ssison user not logged in.
    if (!user) {
        return <p>You need to log in to access the dashboard.</p>;
    }

    return (
        <div>
            <h1>Welcome, {user.firstName || user.given_name} {user.lastName}!</h1>
            <p>Your user type is: {user.userType}</p>

            {/* Sign Out Button */}
            <button onClick={signOut}>Sign Out</button>

        {/*    return here what needed to be displayed */}
        </div>
    );

}