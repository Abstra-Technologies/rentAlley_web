'use client'
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TenantDetails() {
    const params = useParams();
    console.log("Params from useParams():", params); // Debugging
    const user_id = params?.user_id;
    console.log("Extracted user_id:", user_id);

    const [landlordInfo, setlandlordInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLandlordDetails = async () => {
            try {
                const response = await fetch(`/api/landlord/details/${user_id}`);

                if (!response.ok) {
                    new Error('Failed to fetch tenant details.');
                }

                const data = await response.json();
                setlandlordInfo(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLandlordDetails();
    }, [user_id]);

    if (loading) return <p>Loading landlord details...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

    return (
        <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
            <h2>Landlord Details</h2>

            {/* Profile Section */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <img
                    src={landlordInfo?.profilePicture || "/default-avatar.png"}
                    alt="Profile"
                    width="120"
                    height="120"
                    style={{ borderRadius: "50%", border: "2px solid #ddd" }}
                />
                <h3>{landlordInfo?.firstName} {landlordInfo?.lastName}</h3>
                <p>{landlordInfo?.email}</p>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                <tr>
                    <td><strong>User ID:</strong></td>
                    <td>{landlordInfo?.user_id}</td>
                </tr>
                <tr>
                    <td><strong>Landlord ID:</strong></td>
                    <td>{landlordInfo?.landlord_id}</td>
                </tr>
                <tr>
                    <td><strong>Phone Number:</strong></td>
                    <td>{landlordInfo?.phoneNumber || "N/A"}</td>
                </tr>
                <tr>
                    <td><strong>Verified:</strong></td>
                    <td>{landlordInfo?.emailVerified ? "Yes ✅" : "No ❌"}</td>
                </tr>
                <tr>
                    <td><strong>Joined On:</strong></td>
                    <td>{new Date(landlordInfo?.landlordCreatedAt).toLocaleDateString()}</td>
                </tr>
                </tbody>
            </table>

            {/* Activity Logs */}
            <h3 style={{ marginTop: "20px" }}>Activity Logs</h3>
            {landlordInfo?.activityLogs?.length > 0 ? (
                <ul style={{ listStyleType: "none", padding: 0 }}>
                    {landlordInfo.activityLogs.map((log, index) => (
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
