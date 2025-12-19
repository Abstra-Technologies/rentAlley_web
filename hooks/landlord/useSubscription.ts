"use client";

import useSWR from "swr";
import axios from "axios";

const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

export default function useSubscription(
    landlordId?: number | string
) {
    const {
        data,
        error,
        isLoading,
        mutate,
    } = useSWR(
        landlordId
            ? `/api/landlord/subscription/active/${landlordId}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            dedupingInterval: 60_000, // cache for 1 minute
            keepPreviousData: true,  // 🚀 no loading flicker
        }
    );

    return {
        subscription: data ?? null,
        loadingSubscription: isLoading,
        errorSubscription: error
            ? error.response?.data?.error ??
            error.response?.data?.message ??
            "Failed to fetch subscription."
            : null,
        refreshSubscription: () => mutate(),
    };
}
