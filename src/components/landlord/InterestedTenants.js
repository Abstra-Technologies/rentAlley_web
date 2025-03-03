"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  AiOutlineArrowLeft,
  AiOutlineCheck,
  AiOutlineClose,
} from "react-icons/ai";
import Swal from "sweetalert2";
import LoadingScreen from "../../components/loadingScreen";
import Image from "next/image";

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

      Swal.fire({
        title: "Success!",
        text: `Tenant has been ${status} successfully!`,
        icon: "success",
      });
      setReason("");
      setSelectedTenantId(null);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to update tenant status.",
        icon: "error",
      });
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            onClick={() => router.back()}
          >
            <AiOutlineArrowLeft className="text-xl" />
            <span className="font-medium">Back to Properties</span>
          </button>
          <h2 className="text-3xl font-bold text-blue-600">Prospective Tenants</h2>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Status Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-500">
                Total Applicants: <span className="text-gray-900 ml-1">{tenants.length}</span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Approved: <span className="text-green-600 ml-1">
                  {tenants.filter(t => t.status === 'approved').length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Pending: <span className="text-amber-600 ml-1">
                  {tenants.filter(t => t.status === 'pending').length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Disapproved: <span className="text-red-600 ml-1">
                  {tenants.filter(t => t.status === 'disapproved').length}
                </span>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant?.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-12 w-12">
                        <Image
                          src={tenant?.profilePicture}
                          alt="Tenant Profile"
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover"
                        />
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
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
                      <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                        {tenant?.firstName} {tenant?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.current_home_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        tenant?.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : tenant?.status === 'disapproved'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tenant?.status?.charAt(0).toUpperCase() + tenant?.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          className={`inline-flex items-center justify-center p-2 rounded-full ${
                            tenant?.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          } transition-colors duration-200`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTenantStatus(tenant?.id, "approved");
                          }}
                          disabled={tenant?.status === 'approved'}
                          title="Approve Tenant"
                        >
                          <AiOutlineCheck className="w-5 h-5" />
                        </button>
                        <button
                          className={`inline-flex items-center justify-center p-2 rounded-full ${
                            tenant?.status === 'disapproved'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          } transition-colors duration-200`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTenantId(tenant?.id);
                          }}
                          disabled={tenant?.status === 'disapproved'}
                          title="Disapprove Tenant"
                        >
                          <AiOutlineClose className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      No prospective tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Disapproval Modal - Improved */}
      {selectedTenantId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Disapprove Tenant</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for disapproval:
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows="4"
                placeholder="Please provide a reason for disapproval..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200"
                  onClick={() => setSelectedTenantId(null)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-red-500 text-white rounded-md transition-colors duration-200 ${
                    reason.trim() ? 'hover:bg-red-600' : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => updateTenantStatus(selectedTenantId, "disapproved")}
                  disabled={!reason.trim()}
                >
                  Disapprove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}