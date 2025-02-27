"use client";
import { useEffect, useState } from "react";
import useAuthStore from "../../../../zustand/authStore";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LandlordPropertyChart from "../../../../components/analytics/landlordAnalytics";
import LoadingScreen from "../../../../components/loadingScreen";
import useAuth from "../../../../../hooks/useSession";

export default function LandlordDashboard() {
    const { user, admin, loading } = useAuthStore();
    const [isMounted, setIsMounted] = useState(false); // Ensures hydration consistency
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true); // Prevent hydration mismatch
    }, []);

    useEffect(() => {
        if (isMounted && !loading && !user && !admin) {
            router.push("/login");
        }
    }, [isMounted, user, admin, loading, router]);

    if (!isMounted) return null;

    if (!user) {
        return null;
    }

    return (
        <LandlordLayout>
            <div>
                <LandlordPropertyChart />
            </div>
        </LandlordLayout>
    );
}
