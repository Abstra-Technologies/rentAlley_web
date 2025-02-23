'use client'

import { useEffect, useState } from "react";
import useAuth from "../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, CircularProgress, Box
} from "@mui/material";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";
import Link from "next/link";

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
        <div className="flex">
            {/* Sidebar Navigation */}
            <SideNavAdmin />
    
            {/* Main Content */}
            <div className="flex-1 p-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">Activity Logs</h1>
                
                {/* Filters Row */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-4">
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                            Today
                        </button>
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                            Last 7 Days
                        </button>
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                            Last 30 Days
                        </button>
                    </div>
    
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <svg
                            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                        </svg>
                    </div>
                </div>
    
                {/* Activity Logs Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.length > 0 ? (
                                logs.map((log, index) => (
                                    <tr key={log.log_id || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                            <Link href={`/admin/users/${log.user_id || log.admin_id}`}>
                                                {log.user_id || log.admin_id || "N/A"}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {log.user_name || "Anonymous User"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    log.action?.includes("create") || log.action?.includes("add")
                                                        ? "bg-green-100 text-green-800"
                                                        : log.action?.includes("delete") || log.action?.includes("remove")
                                                        ? "bg-red-100 text-red-800"
                                                        : log.action?.includes("update") || log.action?.includes("edit")
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-blue-100 text-blue-800"
                                                }`}
                                            >
                                                {log.action || "Unknown Action"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button className="text-indigo-600 hover:text-indigo-900">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg
                                                className="w-12 h-12 text-gray-300 mb-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                ></path>
                                            </svg>
                                            <p>No activity logs available</p>
                                            <p className="mt-1 text-gray-400">
                                                Activity logs will appear here as users interact with the system
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    
}
