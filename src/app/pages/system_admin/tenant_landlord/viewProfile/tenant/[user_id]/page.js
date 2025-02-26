/*
TODO:
1. Redesign
2. Add Buttons to navigate Back.

 */

'use client'
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoadingScreen from "../../../../../../../components/loadingScreen";

export default function TenantDetails() {
    const params = useParams();
    console.log("Params from useParams():", params); // Debugging
    const user_id = params?.user_id;
    console.log("Extracted user_id:", user_id);

    const [tenantInfo, setTenantInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTenantDetails = async () => {
            try {
                const response = await fetch(`/api/tenant/details/${user_id}`);

                if (!response.ok) {
                    new Error('Failed to fetch tenant details.');
                }
                const data = await response.json();
                setTenantInfo(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTenantDetails();
    }, [user_id]);

    if (loading) return  <LoadingScreen />;;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

    return (
        <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
            <h2>Tenant Details</h2>

            {/* Profile Section */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <img
                    src={tenantInfo?.profilePicture || "/default-avatar.png"}
                    alt="Profile"
                    width="120"
                    height="120"
                    style={{ borderRadius: "50%", border: "2px solid #ddd" }}
                />
                <h3>{tenantInfo?.firstName} {tenantInfo?.lastName}</h3>
                <p>{tenantInfo?.email}</p>
            </div>

            {/* Tenant Information */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                <tr>
                    <td><strong>User ID:</strong></td>
                    <td>{tenantInfo?.user_id}</td>
                </tr>
                <tr>
                    <td><strong>Tenant ID:</strong></td>
                    <td>{tenantInfo?.tenant_id}</td>
                </tr>
                <tr>
                    <td><strong>Phone Number:</strong></td>
                    <td>{tenantInfo?.phoneNumber || "N/A"}</td>
                </tr>
                <tr>
                    <td><strong>Email Address:</strong></td>
                    <td>{tenantInfo?.email || "N/A"}</td>
                </tr>
                <tr>
                    <td><strong>Verified:</strong></td>
                    <td>{tenantInfo?.emailVerified ? "Yes ✅" : "No ❌"}</td>
                </tr>
                <tr>
                    <td><strong>Joined On:</strong></td>
                    <td>{new Date(tenantInfo?.tenantCreatedAt).toLocaleDateString()}</td>
                </tr>
                </tbody>
            </table>

            {/* Activity Logs */}
            <h3 style={{ marginTop: "20px" }}>Activity Logs</h3>
            {tenantInfo?.activityLogs?.length > 0 ? (
                <ul style={{ listStyleType: "none", padding: 0 }}>
                    {tenantInfo.activityLogs.map((log, index) => (
                        <li key={index} style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                            📌 {log.action} - <i>{new Date(log.timestamp).toLocaleString()}</i>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No activity logs available.</p>
            )}
        </div>
    );
}
