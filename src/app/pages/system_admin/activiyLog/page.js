'use client'

import { useEffect, useState } from "react";
import useAuth from "../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, CircularProgress, Box
} from "@mui/material";

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { admin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch("/api/activityLogs/logs");
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Failed to fetch logs.");

                setLogs(data.logs || []);
            } catch (error) {
                console.error("Error fetching activity logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (!admin) {
        return null;
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h5" gutterBottom>Activity Logs</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>User ID</strong></TableCell>
                            <TableCell><strong>Action</strong></TableCell>
                            <TableCell><strong>Timestamp</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.length > 0 ? (
                            logs.map((log, index) => (
                                <TableRow key={log.log_id || index}>
                                    <TableCell>{log.user_id || log.admin_id || "N/A"}</TableCell>
                                    <TableCell>{log.action || "Unknown Action"}</TableCell>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No logs available</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
