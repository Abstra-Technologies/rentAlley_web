"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import InterestedTenants from "@/components/landlord/prospective/InterestedTenants";
import LoadingScreen from "@/components/loadingScreen";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import useAuthStore from "@/zustand/authStore";

export default function TenantRequest() {
    const { propertyId } = useParams();
    const [loading, setLoading] = useState(true);
    const [landlordId, setLandlordId] = useState<number | null>(null);
    const { fetchSession, user } = useAuthStore();

    useEffect(() => {
        const loadSession = async () => {
            setLoading(true);
            await fetchSession();
            setLoading(false);
        };
        loadSession();
    }, []);

    useEffect(() => {
        if (user) {
            setLandlordId(user.landlord_id);
        }
    }, [user]);

    return (
        <>
            {loading ? (
                <LoadingScreen />
            ) : (
                <LandlordLayout>
                    <InterestedTenants
                        propertyId={propertyId}
                        landlordId={landlordId}
                    />
                </LandlordLayout>
            )}
        </>
    );
}
