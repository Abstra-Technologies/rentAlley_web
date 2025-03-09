'use client'
import { useEffect, useState } from "react";
import useAuth from "../../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import { Eye, Trash2 } from "lucide-react";
import LoadingScreen from "../../../../../components/loadingScreen";

export default function TenantList() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { admin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                setLoading(true);
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

    if (error) return <p className="text-red-500 p-6">Error: {error}</p>;

    if (loading) {
        return <LoadingScreen />;
    }

    if (!admin) {
        return <p className="text-red-500 p-6">You need to log in to access the dashboard.</p>;
    }

    return (
        <div className="flex">
            <SideNavAdmin />

            <div className="flex-1 p-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">Tenants List</h1>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tenant ID</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">User ID</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date Registered</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.length > 0 ? (
                                    tenants.map((tenant, index) => (
                                        <tr key={tenant.tenant_id} className="hover:bg-gray-50 border-b">
                                            <td className="px-6 py-4 text-blue-600">{index + 1}</td>
                                            <td className="px-6 py-4">{tenant.user_id}</td>
                                            <td className="px-6 py-4">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            router.push(`./viewProfile/tenant/${tenant.user_id}`);
                                                        }}
                                                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                            <p>No tenants found</p>
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