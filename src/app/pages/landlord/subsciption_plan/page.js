"use client";

import useAuth from "../../../../../hooks/useSession";
import LandlordSubscriptionPlanComponent from "../../../../components/landlord/subscrription";

export default function LandlordSubscriptionPlan() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Subscription Policy</h1>

            <div className="space-y-6">
                {/* Upgrade Policy */}
                <section className="border-b pb-4">
                    <h2 className="text-2xl font-semibold text-gray-700">Upgrade Policy</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Rentahan offers a flexible upgrade policy for subscription plans. If you choose to upgrade your plan before the current billing cycle ends, 
                        the additional cost will be pro-rated based on the remaining days of your subscription. This ensures you only pay for the difference in 
                        service level for the time used.
                    </p>
                </section>

                {/* Free Trial Policy */}
                <section className="border-b pb-4">
                    <h2 className="text-2xl font-semibold text-gray-700">Free Trial Policy</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Each user is eligible for only one free trial period. If a user has previously used a free trial, they will not be eligible for another. 
                        Users are not required to provide payment details upon signing up for the free trial.
                    </p>
                </section>

                {/* Refund Policy */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-700">Refund Policy</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Rentahan does not offer refunds for subscriptions once a payment has been processed.
                    </p>
                </section>
            </div>

            {/* Subscription Plan Component */}
            <div className="mt-8">
                <LandlordSubscriptionPlanComponent landlord_id={user.landlord_id} />
            </div>
        </div>
    );
}
