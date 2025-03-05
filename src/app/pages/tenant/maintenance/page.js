"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import Link from "next/link";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";

const TenantMaintenance = () => {
  const user = useAuth();
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.user?.tenant_id) return; // Ensure user is loaded

    const fetchMaintenanceRequests = async () => {
      try {
        const response = await axios.get(
          `/api/maintenance/get?tenantId=${user.user?.tenant_id}`
        );

        console.log("Fetched Maintenance Requests:", response.data);
        if (response.status === 200) {
          setMaintenanceRequests(response.data || []); // Ensure it's an array
        }

        console.log("Fetched Maintenance Requests:", response.data);
      } catch (error) {
        console.error("Error fetching maintenance requests:", error);
        setMaintenanceRequests([]); // Fallback to an empty array
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceRequests();
  }, [user.user?.tenant_id]); // Avoids accessing `undefined`

  return (
    <TenantLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header with Title and Buttons */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-600">
            My Maintenance Requests
          </h2>
          <div className="flex space-x-2">
            {/* Create Button */}
            <Link href="/pages/tenant/maintenance/add">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                + Create
              </button>
            </Link>

            {/* View History Button */}
            <Link href="/pages/tenant/maintenance/history">
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                View History
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : maintenanceRequests.length === 0 ? (
          <p className="text-gray-500">No maintenance requests found.</p>
        ) : (
          <div className="flex flex-col space-y-4">
            {maintenanceRequests.map((request) => (
              <div
                key={request.request_id}
                className="flex items-center bg-white shadow-md rounded-lg p-4 space-x-4"
              >
                {/* Maintenance Image */}
                {request.photos && request.photos.length > 0 ? (
                  <img
                    src={request.photos[0]} // Show first image
                    alt="Maintenance"
                    className="w-40 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-32 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}

                {/* Maintenance Details */}
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
                    <span
                      className={`px-2 py-1 rounded-md text-white text-xs ${
                        request.status === "Pending"
                          ? "bg-yellow-500"
                          : request.status === "Scheduled"
                          ? "bg-blue-500"
                          : request.status === "In-Progress"
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                    >
                      {request.status}
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
};

export default TenantMaintenance;
