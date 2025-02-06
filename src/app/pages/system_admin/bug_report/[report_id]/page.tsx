"use client";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";

// Fetch function for SWR
const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch bug report");
    return res.json();
};

export default function BugReportDetails() {
    const router = useRouter();
    const { report_id } = useParams();
    const { data, error, isLoading } = useSWR(`/api/systemadmin/bugReport/${report_id}`, fetcher);

    const [status, setStatus] = useState(data?.status || "open");
    const [adminMessage, setAdminMessage] = useState("");

    if (error) return <p className="text-red-500 text-center">Failed to load bug report.</p>;
    if (isLoading) return <p className="text-center text-gray-500">Loading bug report...</p>;

    const handleUpdate = async () => {
        const response = await fetch(`/api/systemadmin/bugReport/update/${report_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status, adminMessage }),
        });

        if (response.ok) {
            alert("Bug report updated successfully");
            router.refresh(); // Refresh page after update
        } else {
            alert("Failed to update bug report");
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">{data.subject}</h2>
            <p className="text-gray-700 mb-4">{data.description}</p>
            <p className="text-sm text-gray-500">Reported by: {data.user_id || "N/A"}</p>
            <p className="text-sm text-gray-500">Created at: {new Date(data.created_at).toLocaleString()}</p>

            {/* Status Update */}
            <div className="mt-6">
                <label className="block font-semibold mb-2">Update Status:</label>
                <select
                    className="border border-gray-300 p-2 rounded w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* Admin Message */}
            <div className="mt-4">
                <label className="block font-semibold mb-2">Admin Message:</label>
                <textarea
                    className="border border-gray-300 p-2 rounded w-full"
                    rows={4}
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                />
            </div>

            {/* Update Button */}
            <button
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleUpdate}
            >
                Update Report
            </button>
        </div>
    );
}
