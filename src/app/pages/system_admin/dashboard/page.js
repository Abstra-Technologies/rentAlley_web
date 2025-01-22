'use client'

import { useEffect, useState } from "react";
import {useRouter} from "next/navigation";

export default function AdminDashboard() {
    const [adminInfo, setAdminInfo] = useState({ username: "", role: "" });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
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

    const handleSignout = async () => {
        try {
            const res = await fetch("/api/systemadmin/signout", {
                method: "POST",
                credentials: "include", // Ensure cookies are included
            });

            if (res.ok) {
                alert("Successfully signed out.");
                router.push("/pages/system_admin/login"); // Redirect to login page
            } else {
                alert("Failed to sign out.");
            }
        } catch (error) {
            console.error("Error during signout:", error);
            alert("Something went wrong. Please try again.");
        }
    };


    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h1>Welcome to the Admin Dashboard</h1>
            <p><strong>Name:</strong> {adminInfo.username}</p>
            <p><strong>Role:</strong> {adminInfo.role}</p>


            <button
                onClick={handleSignout}
                className="mt-4 py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition"
            >
                Sign Out
            </button>
        </div>
    );
}
