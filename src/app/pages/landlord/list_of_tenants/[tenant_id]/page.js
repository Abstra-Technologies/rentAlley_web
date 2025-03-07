// pages/tenant/[tenant_id].js
"use client"; // Required for Next.js App Router

import {useParams, useSearchParams} from "next/navigation";
import { useEffect, useState } from "react";

export default function TenantDetails() {
    const params = useParams();
    const tenant_id = params?.tenant_id;

    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenant_id) return;

        fetch(`/api/landlord/tenants/details/${tenant_id}`)
            .then((res) => res.json())
            .then((data) => {
                setTenant(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching tenant details:", error);
                setLoading(false);
            });
    }, [tenant_id]);

    if (loading) return <p>Loading tenant details...</p>;
    if (!tenant) return <p>Tenant not found.</p>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Tenant Details</h1>
            <div className="bg-white shadow-md rounded-lg p-6">
                <p><strong>Name:</strong> {tenant.firstName} {tenant.lastName}</p>
                <p><strong>Email:</strong> {tenant.email}</p>
                <p><strong>Employment Type:</strong> {tenant.employment_type}</p>
                <p><strong>Occupation:</strong> {tenant.occupation}</p>
                <p><strong>Property:</strong> {tenant.property_name}</p>
                <p><strong>Unit ID:</strong> {tenant.unit_id}</p>
                <p><strong>Lease Start Date:</strong> {new Date(tenant.start_date).toLocaleDateString()}</p>
                <p><strong>Lease End Date:</strong> {new Date(tenant.end_date).toLocaleDateString()}</p>

                <button
                    onClick={() => window.history.back()}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Back to Tenants
                </button>
            </div>
        </div>
    );
}
