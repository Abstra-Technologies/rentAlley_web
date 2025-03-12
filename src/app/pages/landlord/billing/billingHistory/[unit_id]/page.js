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
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
  
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Billing History</h1>
        </div>
  
        <div className="overflow-hidden shadow-md rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-700">
                <th className="px-4 py-3 font-medium">Billing Period</th>
                <th className="px-4 py-3 font-medium">Total Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {billingHistory.map((bill) => (
                <tr key={bill.billing_id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3">
                    {new Date(bill.billing_period).toISOString().split("T")[0]}
                  </td>
                  <td className="px-4 py-3 font-medium">₱{bill.total_amount_due}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === "paid" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(bill.due_date).toISOString().split("T")[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LandlordLayout>
  );
}
