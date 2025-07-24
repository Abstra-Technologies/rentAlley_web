import { useEffect, useState } from "react";
import axios from "axios";

interface LeaseAgreement {
  agreement_id: number;
  start_date: string;
  end_date: string;
  duration: number;
  status: "active" | "inactive" | string;
}

interface LeaseAgreementWidgetProps {
  agreement_id: number;
}

export default function LeaseAgreementWidget({ agreement_id }: LeaseAgreementWidgetProps) {
  const [lease, setLease] = useState<LeaseAgreement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLease() {
      try {
        const response = await axios.get<{ lease: LeaseAgreement }>(
            `/api/tenant/dashboard/getLeaseWidget?agreement_id=${agreement_id}`
        );
        console.log("Raw lease response:", response.data);
        // @ts-ignore
        setLease(response.data.lease[0]); // set the array
      } catch (err: any) {
        console.error("Error fetching lease:", err);
        setError(
            err.response?.data?.message || "Failed to fetch lease agreement."
        );
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchLease();
  }, [agreement_id]);


  const formatDate = (date: string | Date): string => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      return "Invalid date";
    }
  };


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
          {formatDate(lease.end_date)}
        </p>
        <p>
          <strong className="text-gray-800">Duration:</strong>{" "}
          {lease.duration ? `${lease.duration} days` : "N/A"}
        </p>
        <p>
          <strong className="text-gray-800">Status:</strong>{" "}
          <span
            className={`font-bold ${
              lease.status === "active" ? "text-green-600" : "text-red-600"
            }`}
          >
            {lease.status?.toUpperCase() || "N/A"}
          </span>
        </p>
      </div>
    </div>
  );
}
