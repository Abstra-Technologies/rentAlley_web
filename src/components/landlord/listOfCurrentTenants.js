// components/TenantList.js /api/landlord/tenantList?landlord_id=${landlordId}
'use client'
import { useEffect, useState } from "react";

export default function TenantList({ landlord_id }) {
    const [tenants, setTenants] = useState([]); // Ensure tenants is always an array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (!landlord_id) return <p>Please provide a valid landlord ID.</p>;
    if (loading) return <p>Loading tenants...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Current Tenants</h2>
            {tenants.length === 0 ? (
                <p>No active tenants found.</p>
            ) : (
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">Tenant Name</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Property </th>
                        <th className="border p-2">Unit Occupied</th>
                        <th className="border p-2">Start Date</th>
                        <th className="border p-2">End Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tenants.map((tenant) => (
                        <tr key={tenant?.tenant_id} className="text-center">
                            <td className="border p-2">{tenant?.firstName}</td>
                            <td className="border p-2">{tenant?.email}</td>
                            <td className="border p-2">{tenant?.property_name}</td>
                            <td className="border p-2">{tenant?.unit_id}</td>
                            <td className="border p-2">{new Date(tenant.start_date).toLocaleDateString()}</td>
                            <td className="border p-2">{new Date(tenant.end_date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
