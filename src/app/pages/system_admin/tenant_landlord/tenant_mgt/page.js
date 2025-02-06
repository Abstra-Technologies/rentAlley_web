'use client'
import {useEffect, useState} from "react";
import useAuth from "../../../../../../hooks/useSession";
import {useRouter} from "next/navigation";

export default function  LandlordList() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
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

    if (loading) return <p>Loading Tenants...</p>;
    if (error) return <p>Error: {error}</p>;

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <p>You need to log in to access the dashboard.</p>;
    }


    return (
        <div>
            <h2>Tenants List</h2>
            <table border="1" cellPadding="10">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Tenant ID</th>
                    <th>User ID</th>
                    <th>Profile Picture</th>
                    <th>Created At</th>
                </tr>
                </thead>
                <tbody>
                <>
                    {tenants.map((tenant, index) => (
                        <tr key={tenant.tenant_id}>
                            <td>{index + 1}</td>
                            <td>{tenant.tenant_id}</td>
                            <td>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log("Navigating to:", `./viewProfile/tenant/${tenant.user_id}`);
                                        router.push(`./viewProfile/tenant/${tenant.user_id}`);
                                    }}
                                    style={{color: "blue", textDecoration: "underline", cursor: "pointer"}}
                                >
                                    {tenant.user_id}
                                </a>
                            </td>
                            <td>{tenant.profilePicture}</td>
                            <td>{tenant.verified}</td>
                            <td>{tenant.createdAt}</td>
                        </tr>
                    ))}
                </>
                </tbody>
            </table>
        </div>
    );
};