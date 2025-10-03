// landlord side
//  used in viewUnits page

import useSWR from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function usePropertyData(propertyId: string, landlordId?: string) {
    const { data: property } = useSWR(
        propertyId ? `/api/propertyListing/viewDetailedProperty/${propertyId}` : null,
        fetcher
    );

    const { data: subscription, isLoading: loadingSubscription } = useSWR(
        landlordId ? `/api/landlord/subscription/active/${landlordId}` : null,
        fetcher
    );

    const { data: units, error, isLoading } = useSWR(
        propertyId ? `/api/unitListing/getUnitListings?property_id=${propertyId}` : null,
        fetcher
    );

    return { property, subscription, units, error, isLoading, loadingSubscription };
}
