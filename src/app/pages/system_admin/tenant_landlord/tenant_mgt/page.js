'use client'
import {useEffect, useState} from "react";
import useAuth from "../../../../../../hooks/useSession";
import {useRouter} from "next/navigation";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import { Eye, Trash2 } from "lucide-react"
import LoadingScreen from "../../../../../components/loadingScreen";

export default function  TenantList() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { admin } = useAuth();
const router = useRouter();
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await fetch("/api/tenant/list");

                if (!response.ok) {
                    new Error('Failed to fetch tenants.');
                }
                const data = await response.json();
                setTenants(data.tenants);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, []);

    if (error) return <p>Error: {error}</p>;

    if (loading) {
        return <LoadingScreen />;
    }

    if (!admin) {
        return <p>You need to log in to access the dashboard.</p>;
    }


    return (
        <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SideNavAdmin />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tenants List</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-white-200">
                  <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">Tenant ID</th>
                  <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">User ID</th>
                  <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">Date Registered</th>
                  <th className="px-6 py-4 text-right text-lg font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant, index) => (
                  <tr 
                    key={tenant.tenant_id} 
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-lg text-blue-600 font-medium">
                        {index + 1}
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-800 font-medium">
                      {tenant.tenant_id}
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-800 font-medium">
                      {tenant.user_id}
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-800">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-lg text-right">
                      <div className="flex justify-end space-x-4">
                      <button
                          onClick={(e) => {
                            e.preventDefault()
                            router.push(`./viewProfile/tenant/${tenant.user_id}`)}}
                          className="text-blue-400 hover:text-blue-800 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-6 h-6" />  
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.tenant_id)}
                          className="text-red-400 hover:text-red-800 transition-colors"
                          title="Delete Tenant"
                        >
                          <Trash2 className="w-6 h-6" /> 
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>


    );
};