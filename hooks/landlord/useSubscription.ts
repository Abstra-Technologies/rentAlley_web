"use client";

import useSWR from "swr";
import axios from "axios";

const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

export type Subscription = {
    subscription_id: number;
    plan_id: number;
    plan_code: string;
    plan_name: string;
    price: number;
    billing_cycle: "monthly" | "yearly" | "lifetime";

    start_date: string;
    end_date: string;
    payment_status: string;
    is_trial: number;
    is_active: number;

    limits: {
        maxProperties: number | null;
        maxUnits: number | null;
        maxMaintenanceRequest: number | null;
        maxBilling: number | null;
        maxProspect: number | null;
        maxStorage: number | null;
        maxAssetsPerProperty: number | null;
        financialHistoryYears: number | null;
    };

    features: {
        reports: boolean;
        pdcManagement: boolean;
        aiUnitGenerator: boolean;
        bulkImport: boolean;
        announcements: boolean;
        assetManagement: boolean;
        financialInsights: boolean;
    };
};

export default function useSubscription(
    landlordId?: number | string
) {
    const {
        data,
        error,
        isLoading,
        mutate,
    } = useSWR<Subscription>(
        landlordId
            ? `/api/landlord/subscription/active/${landlordId}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            dedupingInterval: 60_000,
            keepPreviousData: true,
        }
    );

    // 🔥 Helper: check unlimited
    const isUnlimited = (value: number | null | undefined) =>
        value === null || value === undefined;

    return {
        subscription: data ?? null,
        loadingSubscription: isLoading,

        errorSubscription: error
            ? error.response?.data?.error ??
            error.response?.data?.message ??
            "Failed to fetch subscription."
            : null,

        refreshSubscription: () => mutate(),

        // 🚀 Utility helpers
        isUnlimited,
    };
}
