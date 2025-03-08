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
    <div className="bg-white shadow-lg rounded-lg p-4 border">
      <h2 className="text-lg font-semibold text-gray-800">Lease Agreement</h2>
      <p>
        <strong>Start Date:</strong>{" "}
        {new Date(lease?.start_date).toLocaleDateString() || "N/A"}
      </p>
      <p>
        <strong>End Date:</strong>{" "}
        {new Date(lease?.end_date).toLocaleDateString() || "N/A"}
      </p>
      <p>
        <strong>Duration:</strong> {lease?.duration} days
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <span
          className={`text-${
            lease?.status === "active" ? "green" : "red"
          }-600 font-bold`}
        >
          {lease?.status.toUpperCase() || "N/A"}
        </span>
      </p>
      {lease?.agreement_url && (
        <a
          href={lease?.agreement_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline mt-2 block"
        >
          View Lease Agreement
        </a>
      )}
    </div>
  );
}
