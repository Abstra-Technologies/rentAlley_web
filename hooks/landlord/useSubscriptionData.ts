"use client";

import { useState, useEffect } from "react";
import useAuthStore from "@/zustand/authStore";

export default function useSubscriptionData() {
    const { user } = useAuthStore();

    const [trialUsed, setTrialUsed] = useState<boolean | null>(null);
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            setLoading(true);
            try {
                // Trial status
                const trialRes = await fetch("/api/landlord/subscription/freeTrialTest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ landlord_id: user.landlord_id }),
                });
                const trialJson = await trialRes.json();
                setTrialUsed(trialJson?.is_trial_used);

                // Current subscription
                const subRes = await fetch(`/api/landlord/subscription/active/${user.landlord_id}`);
                if (subRes.ok) {
                    const subJson = await subRes.json();
                    setCurrentSubscription(subJson);
                }
            } catch (err) {
                console.error("Error fetching subscription:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    return { trialUsed, currentSubscription, loading };
}
