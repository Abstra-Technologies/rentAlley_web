'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PropertyList() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        async function fetchProperties() {
            try {
                const res = await fetch("/api/properties/list");
                const data = await res.json();

                if (!data.properties.length) {
                    setError("No properties found.");
                } else {
                    setProperties(data.properties);
                }
            } catch (err) {
                setError("Failed to load properties.");
            }
            setLoading(false);
        }

        fetchProperties();
    }, []);

    if (loading) return <p className="text-center p-6">Loading properties...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Property Listings</h1>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2">ID</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">City</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Verification</th>
                    <th className="border p-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {properties.map((property) => (
                    <tr key={property.property_id} className="hover:bg-gray-50">
                        <td className="border p-2">{property.property_id}</td>
                        <td className="border p-2">{property.property_name}</td>
                        <td className="border p-2">{property.city}</td>
                        <td className="border p-2">{property.property_status}</td>
                        <td className="border p-2">{property.verification_status || 'Pending'}</td>
                        <td className="border p-2">
                            <button
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                                onClick={() => router.push(`./details/${property.property_id}`)}
                                // onClick={() => router.push(`/pages/system_admin/dashboard`)}

                            >
                                View Details
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
