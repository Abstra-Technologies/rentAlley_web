
"use client";
import { useEffect, useState } from "react";

interface PastSubscription {
    subscription_id: number;
    plan_name: string;
    start_date: string;
    end_date: string;
    payment_status: "paid" | "unpaid" | "pending" | "failed";
    request_reference_number: string;
    is_trial: 0 | 1;
    amount_paid: number;
}

export default function LandlordPastSubscriptionsComponent({
                                                               landlord_id,
                                                           }: {
    landlord_id: number | undefined;
}) {
    const [subscriptions, setSubscriptions] = useState<PastSubscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlord_id) return;

        const fetchPastSubscriptions = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/landlord/${landlord_id}/subscription`
                );
                const data = await res.json();
                setSubscriptions(data);
            } catch (error) {
                console.error("Failed to fetch past subscriptions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPastSubscriptions();
    }, [landlord_id]);

    if (loading) {
        return (
            <div className="p-4 text-gray-500 text-sm">
                Loading past subscriptions...
            </div>
        );
    }

    if (subscriptions.length === 0) {
        return (
            <div className="p-4 text-gray-500 text-sm">
                No past subscriptions found.
            </div>
        );
    }


    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Subscription History
                </h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Period
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                    {subscriptions.map((sub) => (
                        <tr key={sub.subscription_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {sub.plan_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(sub.start_date).toLocaleDateString()} –{" "}
                                {new Date(sub.end_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {sub.request_reference_number}{" "}
                                {sub.is_trial ? "(Trial)" : ""}
                            </td>
                            <td className="px-4 py-3 text-sm">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sub.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : sub.payment_status === "unpaid"
                                ? "bg-red-100 text-red-700"
                                : sub.payment_status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {sub.payment_status}
                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800 text-right">
                                ₱{Number(sub.amount_paid).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

}
