'use client'

import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const [adminInfo, setAdminInfo] = useState({ username: "", role: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch admin info from the API
        const fetchAdminInfo = async () => {
            try {
                const res = await fetch("/api/systemadmin/info", {
                    method: "GET",
                    credentials: "include", // Ensure cookies are sent with the request
                });

                if (res.ok) {
                    const data = await res.json();
                    setAdminInfo(data);
                } else {
                    console.error("Failed to fetch admin info.");
                }
            } catch (error) {
                console.error("Error fetching admin info:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminInfo();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h1>Welcome to the Admin Dashboard</h1>
            <p><strong>Name:</strong> {adminInfo.username}</p>
            <p><strong>Role:</strong> {adminInfo.role}</p>
        </div>
    );
}
