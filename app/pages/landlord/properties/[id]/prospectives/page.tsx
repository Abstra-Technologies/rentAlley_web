"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import InterestedTenants from "@/components/landlord/prospective/InterestedTenants";
import LoadingScreen from "@/components/loadingScreen";
import useAuthStore from "@/zustand/authStore";

export default function TenantRequest() {
    const { id } = useParams();
    const propertyId = id;
    const [loading, setLoading] = useState(true);
    const [landlordId, setLandlordId] = useState<number | null>(null);
    const { fetchSession, user } = useAuthStore();

    console.log('property id:', propertyId);

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
                    <InterestedTenants
                        propertyId={propertyId}
                        landlordId={landlordId}
                    />
            )}
        </>
    );
}
