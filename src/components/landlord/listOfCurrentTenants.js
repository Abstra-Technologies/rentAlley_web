// components/TenantList.js /api/landlord/tenantList?landlord_id=${landlordId}
'use client'
import { useEffect, useState } from "react";
import {router, useRouter} from "next/navigation";
import LandlordLayout from "../navigation/sidebar-landlord";

export default function TenantList({ landlord_id }) {
    const [tenants, setTenants] = useState([]); // Ensure tenants is always an array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();


    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/tenantList?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTenants(data);
                } else {
                    setTenants([]); // Ensure it's always an array
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching tenants:", error);
                setError("Failed to load tenants.");
                setLoading(false);
            });
    }, [landlord_id]);

    const handleViewDetails = (tenant_id) => {
        router.push(`/pages/landlord/list_of_tenants/${tenant_id}`);
    };

    if (!landlord_id) return <p>Please provide a valid landlord ID.</p>;
    if (loading) return <p>Loading tenants...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="flex">
          <div className="flex-1 p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold text-blue-600 mb-6">Current Tenants</h1>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="min-w-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Occupied</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.length > 0 ? (
                      tenants.map((tenant) => (
                        <tr key={tenant?.tenant_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{tenant?.firstName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{tenant?.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{tenant?.property_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{tenant?.unit_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(tenant?.start_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(tenant?.end_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewDetails(tenant?.tenant_id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                          <p>No active tenants found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
}
