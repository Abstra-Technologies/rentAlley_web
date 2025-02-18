"use client";

import useAuth from "../../../../../hooks/useSession";
import BugReportForm from "../../../../components/modules/bugreport";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";


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
        <LandlordLayout>
        <div>
            <BugReportForm user_id={user.user_id} />
        </div>
        </LandlordLayout>
    );
}
