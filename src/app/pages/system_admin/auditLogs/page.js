'use client'
import { useEffect, useState } from "react";

export default function LogsPage() {
    const [logs, setLogs] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            const response = await fetch("/api/auditlogs/logs");
            const text = await response.text();
            setLogs(text);
        };

        fetchLogs();

        // Refresh logs every 5 seconds
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: "20px", background: "#000", color: "#fff", fontFamily: "monospace" }}>
            <h2>📜 Audit Logs</h2>
            <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                {logs || "Loading logs..."}
            </pre>
        </div>
    );
}
