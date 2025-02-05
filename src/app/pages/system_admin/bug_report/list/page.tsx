"use client";
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../../../../../hooks/useSession";
import useSWR from "swr";

// Fetch function for SWR
const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch bug reports");
    return res.json();
};

export default function BugReports() {
    const { user } = useAuth();
    const router = useRouter();

    // Use SWR to fetch bug reports
    const { data, error, isLoading } = useSWR("/api/systemadmin/bugReport/list", fetcher, { refreshInterval: 5000 });

    if (error) return <p className="text-red-500 text-center">Failed to load bug reports.</p>;
    if (isLoading) return <p className="text-center text-gray-500">Loading bug reports...</p>;

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bug Reports</h2>

            {data.bugReports.length === 0 ? (
                <p className="text-center text-gray-500">No bug reports found</p>
            ) : (
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="table-auto w-full">
                        <thead>
                        <tr className="border-b border-gray-300 bg-gray-100">
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2">Reported By</th>
                            <th className="px-4 py-2">Created At</th>
                        </tr>
                        </thead>
                        <tbody>

                        {data.bugReports.length > 0 ? (
                            data.bugReports.map((reports: { reportID: number; User_userID: string; subject: string; description: string; created_at: string }, index: number) => (
                                <tr key={reports.reportID ?? `temp-key-${index}`}>
                                    <td>{index + 1}</td>
                                    <td>{reports.subject}</td>
                                    <td>{reports.description}</td>
                                    <td>{reports.User_userID || "N/A"}</td>
                                    <td>{reports.createdAt || "N/A"}</td>
                                    <td>{new Date(reports.createdAt).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6">No Bug Reports found.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
