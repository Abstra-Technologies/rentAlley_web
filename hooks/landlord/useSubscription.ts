"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

export default function useSubscription(landlordId?: number | string) {
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const [errorSubscription, setErrorSubscription] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    const fetchSubscription = useCallback(async () => {
        // 🔒 HARD GUARD
        if (!landlordId) {
            setSubscription(null);
            setLoadingSubscription(false);
            return;
        }

        // cancel previous request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            setLoadingSubscription(true);

            const response = await axios.get(
                `/api/landlord/subscription/active/${landlordId}`,
                { signal: controller.signal }
            );

            setSubscription(response.data);
            setErrorSubscription(null);
        } catch (error: any) {
            if (error.name === "CanceledError") return;

            if (error.response?.status !== 400) {
                console.error("[Subscription] Error fetching subscription:", error);
            }

            setSubscription(null);
            setErrorSubscription(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to fetch subscription."
            );
        } finally {
            setLoadingSubscription(false);
        }
    }, [landlordId]);

    useEffect(() => {
        if (!landlordId) {
            setLoadingSubscription(false);
            return;
        }

        fetchSubscription();

        return () => {
            abortRef.current?.abort();
        };
    }, [fetchSubscription, landlordId]);

    return {
        subscription,
        loadingSubscription,
        errorSubscription,
        refreshSubscription: fetchSubscription,
    };
}
