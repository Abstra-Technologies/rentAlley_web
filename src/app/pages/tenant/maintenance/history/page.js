"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";

export default function MaintenanceHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedRequests = async () => {
      try {
        const response = await axios.get("/api/maintenance/history");
        setHistory(response.data);
      } catch (error) {
        console.error("Error fetching maintenance history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedRequests();
  }, []);

  return (
    <TenantLayout>
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          Maintenance History
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500">
            No completed maintenance requests found.
          </p>
        ) : (
          <div className="flex flex-col space-y-4">
            {history.map((request) => (
              <div
                key={request.request_id}
                className="flex items-center bg-white shadow-md rounded-lg p-4 space-x-4"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {request.subject}
                  </h3>
                  <p className="text-gray-600">{request.description}</p>
                  <p className="text-sm text-gray-500">
                    Property:{" "}
                    <span className="font-medium">{request.property_name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Unit:{" "}
                    <span className="font-medium">{request.unit_name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Category:{" "}
                    <span className="font-medium">{request.category}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    <span className="px-2 py-1 rounded-md text-white text-xs bg-green-500">
                      Completed
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
