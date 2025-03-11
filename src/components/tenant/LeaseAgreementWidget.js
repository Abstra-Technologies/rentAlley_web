import { useEffect, useState } from "react";
import axios from "axios";

export default function LeaseAgreementWidget({ tenant_id }) {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLease() {
      try {
        const response = await axios.get(
          `/api/tenant/dashboard/getTenantLease?tenant_id=${tenant_id}`
        );
        setLease(response.data[0]);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch lease agreement."
        );
      } finally {
        setLoading(false);
      }
    }

    if (tenant_id) fetchLease();
  }, [tenant_id]);

  if (loading) return <p>Loading lease details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!lease) return <p>No active lease agreement found.</p>;

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Lease Agreement</h2>
      <div className="space-y-2 text-gray-600">
        <p>
          <strong className="text-gray-800">Start Date:</strong>{" "}
          {lease?.start_date
            ? new Date(lease.start_date).toLocaleDateString()
            : "N/A"}
        </p>
        <p>
          <strong className="text-gray-800">End Date:</strong>{" "}
          {lease?.end_date ? new Date(lease.end_date).toLocaleDateString() : "N/A"}
        </p>
        <p>
          <strong className="text-gray-800">Duration:</strong> {lease?.duration || "N/A"} days
        </p>
        <p>
          <strong className="text-gray-800">Status:</strong>{" "}
          <span
            className={`font-bold ${
              lease?.status === "active" ? "text-green-600" : "text-red-600"
            }`}
          >
            {lease?.status?.toUpperCase() || "N/A"}
          </span>
        </p>
      </div>
    </div>
  );
  
}
