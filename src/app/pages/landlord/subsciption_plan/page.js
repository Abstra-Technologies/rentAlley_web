"use client";

import useAuth from "../../../../../hooks/useSession";
import LandlordSubscriptionPlanComponent from "../../../../components/landlord/subscrription";

export default function LandlordSubscriptionPlan() {
    const { user, loading, error } = useAuth();

    if(!user) return ;

    return (
        <div>
            <div className='m-2 p-3'>
                <h2 className='text-xl'>Subscription Policy</h2>
                <p>
                    Rentahan offers a flexible upgrade policy for subscription plans. If you choose to upgrade your plan before the current billing cycle ends, the additional cost will be pro-rated based on the remaining days of your subscription.
                    This ensures you only pay for the difference in service level for the time used
                </p>
            </div>
       <LandlordSubscriptionPlanComponent landlord_id={user.landlord_id} />
        </div>
    );
}
