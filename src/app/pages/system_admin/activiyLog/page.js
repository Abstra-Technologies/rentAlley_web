'use client'

import { useEffect, useState } from "react";

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch("/api/activityLogs/logs");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch logs.");
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
                {logs.map((log) => (
                    <tr key ={log.logID}> {/* Use a unique key */}
                        <td>{log.userID  || log.adminID}</td>
                        <td>{log.action}</td>
                        <td>{log.timestamp}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
