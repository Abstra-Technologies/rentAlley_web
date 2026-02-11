import { useEffect, useState } from "react";
import axios from "axios";

interface PaymentSummary {
    totalCollected: number;
    totalDisbursed: number;
    pendingPayouts: number;
}

export function usePaymentSummary(landlord_id: string) {
    const [summary, setSummary] = useState<PaymentSummary>({
        totalCollected: 0,
        totalDisbursed: 0,
        pendingPayouts: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;

        setIsLoading(true);

        axios
            .get("/api/analytics/landlord/payment-summary", {
                params: { landlord_id },
            })
            .then((res) => {
                setSummary(res.data);
            })
            .catch((err) => {
                console.error("❌ Failed to load payment summary:", err);
            })
            .finally(() => setIsLoading(false));
    }, [landlord_id]);

    return { summary, isLoading };
}
