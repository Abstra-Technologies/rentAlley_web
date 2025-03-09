"use client";
import { useEffect, useState } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";
import LoadingScreen from "../../../../components/loadingScreen";
import useAuth from "../../../../../hooks/useSession";
import axios from "axios";
import NotificationComponent from "../../../../components/notification/notifPopup";

export default function LandlordDashboard() {
    const { user, admin, loading } = useAuthStore();
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);


    return (
        <LandlordLayout>
            <div>
                {/*<NotificationComponent user_id={user?.user_id}/>*/}
                <LandlordPropertyChart />
            </div>
        </LandlordLayout>
    );
}
