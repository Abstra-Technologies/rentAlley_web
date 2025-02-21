"use client";

import useAuth from "../../../../../hooks/useSession";
import LandlordSubscriptionPlanComponent from "../../../../components/landlord/subscrription";

export default function LandlordSubscriptionPlan() {
    const { user, loading, error } = useAuth();
    if(!user) return ;

    return (
        <div>
       <LandlordSubscriptionPlanComponent landlord_id={user.landlord_id} />
        </div>
    );
}
