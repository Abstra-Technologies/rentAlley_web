'use client'

import { useEffect, useState } from "react";
import useAuth from "../../../../../hooks/useSession";

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch("/api/activityLogs/logs");
                const data = await response.json();

                if (!response.ok) {
                     new Error(data.error || "Failed to fetch logs.");
                }

                setLogs(data.logs);
            } catch (error) {
                console.error("Error fetching activity logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <p>You need to log in to access the dashboard.</p>;
    }

    return (
        <div>
            <h1>Activity Logs</h1>
            <table>
                <thead>
                <tr>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Timestamp</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((log, index) => (
                    <tr key={log.logID || index}>
                        <td>{log.user_id || log.admin_id}</td>
                        <td>{log.action}</td>
                        <td>{log.timestamp}</td>
                    </tr>
                ))}

                </tbody>
            </table>
        </div>
    );
}
