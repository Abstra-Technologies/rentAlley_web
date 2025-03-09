import { useState, useEffect } from "react";
import axios from "axios";

export default function TenantPendingPaymentWidget({ tenant_id }) {
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPendingPayments() {
      try {
        const response = await axios.get(
          `/api/tenant/dashboard/getPendingPayments?tenant_id=${tenant_id}`
        );
        console.log(response.data);

        setTotalPending(parseFloat(response.data.total_pending) || 0);
      } catch (err) {
        setError("Failed to fetch pending payments.");
      } finally {
        setLoading(false);
      }
    }

    if (tenant_id) {
      fetchPendingPayments();
    }
  }, [tenant_id]);

  if (loading) return <p>Loading pending payments...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 border mt-6">
      <h2 className="text-lg font-semibold text-gray-800">
        Total Pending Payments
      </h2>
      <p className="text-3xl font-bold text-red-600 mt-2">
        ₱{Number(totalPending).toFixed(2)}
      </p>
    </div>
  );
}
