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
        const res = await fetch(`/api/landlord/${landlord_id}/subscription`);
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
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-3 text-sm text-gray-600">
          Loading past subscriptions...
        </p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-600">No past subscriptions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Mobile View */}
      <div className="sm:hidden space-y-3">
        {subscriptions.map((sub) => (
          <div
            key={sub.subscription_id}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{sub.plan_name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {sub.request_reference_number}
                  {sub.is_trial ? " (Trial)" : ""}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sub.payment_status === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : sub.payment_status === "unpaid"
                    ? "bg-red-100 text-red-700"
                    : sub.payment_status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {sub.payment_status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Period</span>
                <span className="text-gray-900">
                  {new Date(sub.start_date).toLocaleDateString()} –{" "}
                  {new Date(sub.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">
                  ₱{Number(sub.amount_paid).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {subscriptions.map((sub) => (
              <tr
                key={sub.subscription_id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {sub.plan_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(sub.start_date).toLocaleDateString()} –{" "}
                  {new Date(sub.end_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {sub.request_reference_number}{" "}
                  {sub.is_trial && (
                    <span className="text-blue-600 font-medium">(Trial)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      sub.payment_status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : sub.payment_status === "unpaid"
                        ? "bg-red-100 text-red-700"
                        : sub.payment_status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {sub.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
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
