"use client";

import useAuth from "../../../../../hooks/useSession";
import LandlordSubscriptionPlanComponent from "../../../../components/landlord/subscrription";

export default function LandlordSubscriptionPlan() {
    const { user } = useAuth();

    if(!user) return ;

    return (
        <div>
            <div className='m-2 p-3'>
                <h2 className='text-3xl'>Subscription Policy</h2>

                <h2 className='text-xl'>Upgrade Policy</h2>
                <p>
                    Rentahan offers a flexible upgrade policy for subscription plans. If you choose to upgrade your plan before the current billing cycle ends, the additional cost will be pro-rated based on the remaining days of your subscription.
                    This ensures you only pay for the difference in service level for the time used.
                </p>
                <h2 className='text-xl'>Free Trial Policy</h2>
                <p>
                    Each user is eligible for only one free trial period. If a user has previously used a free trial, they will not be eligible for another.
                    Users are not required to provide payment details upon signing up for the free trial.
                </p>
                <h2 className='text-xl'>Refund Policy</h2>
                <p>
                    Rentahan does not offer refunds for subscriptions once a payment has been processed.
                </p>
            </div>
       <LandlordSubscriptionPlanComponent landlord_id={user.landlord_id} />
        </div>
    );
}
