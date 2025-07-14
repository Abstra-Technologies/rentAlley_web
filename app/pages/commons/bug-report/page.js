"use client";

import useAuth from "../../../../hooks/useSession";
import BugReportForm from "../../../../components/modules/bugreport";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import useAuthStore from "../../../../zustand/authStore";


export default function BugReports() {
    const { user, admin, loading } = useAuthStore();


    console.log("User Data ", user);

    return (
        <LandlordLayout>
        <div>
            <BugReportForm user_id={user?.user_id} />
        </div>
        </LandlordLayout>
    );
}
