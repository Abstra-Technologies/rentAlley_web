"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function useSubscription(landlordId?: number | string) {
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true);
    const [errorSubscription, setErrorSubscription] = useState<string | null>(null);

    const fetchSubscription = useCallback(async () => {
        if (!landlordId) return;
        try {
            setLoadingSubscription(true);
            const response = await axios.get(`/api/landlord/subscription/active/${landlordId}`);
            setSubscription(response.data);
            setErrorSubscription(null);
        } catch (error: any) {
            console.error("[Subscription] Error fetching subscription:", error);
            setErrorSubscription(
                error.response?.data?.message || "Failed to fetch subscription."
            );
        } finally {
            setLoadingSubscription(false);
        }
    }, [landlordId]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    return {
        subscription,
        loadingSubscription,
        errorSubscription,
        refreshSubscription: fetchSubscription,
    };
}
