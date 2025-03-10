"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";

export default function BillingHistory() {
  const { unit_id } = useParams();
  const router = useRouter();
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!unit_id) return;

    async function fetchBillingHistory() {
      try {
        const res = await fetch(
          `/api/landlord/billing/getBillingHistory?unit_id=${unit_id}`
        );
        const data = await res.json();

        if (res.ok) {
          setBillingHistory(data);
        } else {
          setError(data.message || "Failed to fetch billing history.");
        }
      } catch (err) {
        setError("Error fetching billing history.");
      } finally {
        setLoading(false);
      }
    }

    fetchBillingHistory();
  }, [unit_id]);

  if (loading) return <p>Loading billing history...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (billingHistory.length === 0)
    return <p>No billing records found for this unit.</p>;

  return (
    <LandlordLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold mb-4">Billing History</h1>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Billing Period</th>
              <th className="border p-2">Total Amount</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Due Date</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.map((bill) => (
              <tr key={bill.billing_id} className="hover:bg-gray-100">
                <td className="border p-2">
                  {new Date(bill.billing_period).toISOString().split("T")[0]}
                </td>
                <td className="border p-2">₱{bill.total_amount_due}</td>
                <td
                  className={`border p-2 ${
                    bill.status === "paid" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                </td>
                <td className="border p-2">
                  {new Date(bill.due_date).toISOString().split("T")[0]}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/pages/landlord/billing/edit/${bill.billing_id}`
                      )
                    }
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LandlordLayout>
  );
}
