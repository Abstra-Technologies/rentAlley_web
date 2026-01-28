import useSWR from "swr";
import axios from "axios";
//  use

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function usePaymentSummary(landlord_id?: string) {
    const { data, error, isLoading } = useSWR(
        landlord_id
            ? `/api/landlord/payments/summary?landlord_id=${landlord_id}`
            : null,
        fetcher
    );

    return {
        summary: data,
        isLoading,
        error,
    };
}
