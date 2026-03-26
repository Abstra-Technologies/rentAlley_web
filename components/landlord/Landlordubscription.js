"use client";
import { useEffect, useState } from "react";

export default function LandlordSubscriptionCurrent({ user_id }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user_id) return;

    const fetchSubscriptions = async () => {
      try {
        const response = await fetch(
          `/api/systemadmin/users/landlords/getSubscription?user_id=${user_id}`
        );
        if (!response.ok) throw new Error("Failed to fetch subscription details.");
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user_id]);

  const getStatusBadge = (is_active, payment_status) => {
    if (is_active === 1) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>;
    }
    if (payment_status === "pending") {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Expired</span>;
  };

  const getPaymentBadge = (status) => {
    const styles = {
      paid: "bg-green-100 text-green-800",
      unpaid: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || styles.unpaid}`}>
        {status}
      </span>
    );
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.is_active === 1).length,
    pending: subscriptions.filter((s) => s.payment_status === "pending").length,
    totalPaid: subscriptions.reduce((acc, s) => acc + parseFloat(s.amount_paid || 0), 0),
  };

  const ScoreCard = ({ title, value, accent }) => {
    const accentClasses = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    };
    return (
      <div className={`rounded-lg border p-3 ${accentClasses[accent]}`}>
        <p className="text-xs opacity-70">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading subscription details...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">Error: {error}</div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription History</h3>

      {subscriptions.length > 0 ? (
        <>
          {/* Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <ScoreCard title="Total Plans" value={stats.total} accent="blue" />
            <ScoreCard title="Active" value={stats.active} accent="green" />
            <ScoreCard title="Pending" value={stats.pending} accent="yellow" />
            <ScoreCard title="Total Paid" value={`₱${stats.totalPaid.toLocaleString()}`} accent="emerald" />
          </div>

          {/* Table - Mobile responsive */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 border-b">Plan</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b hidden sm:table-cell">Start</th>
                  <th className="p-3 border-b hidden sm:table-cell">End</th>
                  <th className="p-3 border-b">Payment</th>
                  <th className="p-3 border-b text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription, index) => (
                  <tr
                    key={index}
                    className={subscription.is_active === 1 ? "bg-green-50/50" : ""}
                  >
                    <td className="p-3 border-b font-medium">{subscription.plan_name}</td>
                    <td className="p-3 border-b">{getStatusBadge(subscription.is_active, subscription.payment_status)}</td>
                    <td className="p-3 border-b hidden sm:table-cell">
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </td>
                    <td className="p-3 border-b hidden sm:table-cell">
                      {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 border-b">{getPaymentBadge(subscription.payment_status)}</td>
                    <td className="p-3 border-b text-right font-medium">
                      ₱{parseFloat(subscription.amount_paid || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No subscription history available.
        </div>
      )}
    </div>
  );
}
