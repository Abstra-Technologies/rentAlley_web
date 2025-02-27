"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  AiOutlineArrowLeft,
  AiOutlineCheck,
  AiOutlineClose,
} from "react-icons/ai";

export default function InterestedTenants({ unitId = null }) {
  const { propertyId } = useParams();
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = "";
  const [reason, setReason] = useState(""); // State for disapproval reason
  const [selectedTenantId, setSelectedTenantId] = useState(null); // Track selected tenant for disapproval

  // Fetch tenants from the API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get(
          `/api/landlord/prospective/interested-tenants?propertyId=${propertyId}&unitId=${
            unitId || ""
          }`
        );
        setTenants(response.data);
      } catch (err) {
        setError("Failed to load tenants.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [propertyId, unitId]);

  // Function to update tenant status (Approve/Disapprove)
  const updateTenantStatus = async (tenantId, status) => {
    try {
      const payload = {
        propertyId,
        unitId,
        status,
        reason: status === "disapproved" ? reason : null,
      };

      await axios.put("/api/landlord/prospective/update-status", payload);

      // Update UI after success
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId ? { ...tenant, status } : tenant
        )
      );

      alert(`Tenant ${status} successfully!`);
      setReason("");
      setSelectedTenantId(null);
    } catch (error) {
      alert("Error updating status.");
    }
  };

  if (loading) return <p>Loading tenants...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        onClick={() => router.back()}
      >
        <AiOutlineArrowLeft className="text-xl" />
        <span>Back</span>
      </button>
      <h2 className="text-2xl font-bold mb-4">Interested Tenants</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="p-3">Profile</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Address</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="border-b hover:bg-gray-100 cursor-pointer"
              >
                <td className="p-3">
                  <img
                    src={tenant.profilePicture}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border"
                  />
                </td>
                <td
                  className="p-3 cursor-pointer hover:text-blue-500 hover:underline"
                  onClick={() => {
                    if (unitId) {
                      router.push(
                        `/pages/landlord/property-listing/view-unit/view-tenant/${unitId}`
                      );
                    } else {
                      router.push(
                        `/pages/landlord/property-listing/view-tenant/${propertyId}`
                      );
                    }
                  }}
                >
                  {tenant.firstName} {tenant.lastName}
                </td>
                <td className="p-3">{tenant.email}</td>
                <td className="p-3">{tenant.phoneNumber}</td>
                <td className="p-3">{tenant.current_home_address}</td>
                <td className="p-3 font-semibold text-gray-700 capitalize">
                  {tenant.status}
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTenantStatus(tenant.id, "approved");
                    }}
                  >
                    <AiOutlineCheck />
                  </button>
                  <button
                    className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTenantId(tenant.id);
                    }}
                  >
                    <AiOutlineClose />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disapproval Modal */}
      {selectedTenantId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Disapprove Tenant</h3>
            <label className="block mb-2">Reason for disapproval:</label>
            <textarea
              className="w-full p-2 border rounded-md"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                onClick={() => setSelectedTenantId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                onClick={() =>
                  updateTenantStatus(selectedTenantId, "disapproved")
                }
                disabled={!reason.trim()}
              >
                Disapprove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
