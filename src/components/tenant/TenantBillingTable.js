import { useEffect, useState } from "react";
import axios from "axios";

export default function TenantBillingTable({ tenant_id }) {
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBillingInfo() {
      try {
        const response = await axios.get(
          `/api/tenant/dashboard/getTenantBilling?tenant_id=${tenant_id}`
        );
        setBillingData(response.data[0]);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch billing data."
        );
      } finally {
        setLoading(false);
      }
    }

    if (tenant_id) {
      fetchBillingInfo();
    }
  }, [tenant_id]);

  if (loading) return <p>Loading billing details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (billingData.length === 0) return <p>No billing records found.</p>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 border mt-6">
      <h2 className="text-lg font-semibold text-gray-800">
        Billing Information
      </h2>
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border px-4 py-2">Total Amount Due</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {billingData.map((bill, index) => {
              const amount = parseFloat(bill?.total_amount_due) || 0; // Convert to number
              return (
                <tr key={index} className="text-center">
                  <td className="border px-4 py-2">${amount.toFixed(2)}</td>
                  <td
                    className={`border px-4 py-2 text-${
                      bill?.status === "paid"
                        ? "green"
                        : bill?.status === "overdue"
                        ? "red"
                        : "yellow"
                    }-600 font-bold`}
                  >
                    {bill?.status?.toUpperCase() || "UNKNOWN"}
                  </td>
                  <td className="border px-4 py-2">
                    {bill?.due_date
                      ? new Date(bill?.due_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
