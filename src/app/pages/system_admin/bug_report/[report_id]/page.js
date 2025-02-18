"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {BUG_REPORT_STATUSES} from "../../../../../constant/bugStatus";
import useAuth from "../../../../../../hooks/useSession";

const maskUserID = (userID) => {
    if (!userID || userID.length < 8) return "N/A";
    return userID.substring(0, 4) + "****-****-****-****-" + userID.slice(-4);
};

export default function BugReportDetails() {
    const router = useRouter();
    const { report_id } = useParams();
    const [bugReport, setBugReport] = useState(null);
    const [status, setStatus] = useState("open");
    const [adminMessage, setAdminMessage] = useState("");
    const { admin } = useAuth();

    useEffect(() => {
        async function fetchBugReport() {
            const res = await fetch(`/api/systemadmin/bugReport/${report_id}`);
            if (res.ok) {
                const data = await res.json();
                setBugReport(data);
                setStatus(data.status);
            }
        }
        fetchBugReport();
    }, [report_id]);

    const handleUpdate = async () => {
        if (!admin.admin_id) {
            alert("Admin not logged in!");
            return;
        }

        const response = await fetch(`/api/systemadmin/bugReport/update/${report_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, adminMessage, updatedByAdmin: admin.admin_id }),
        });

        if (response.ok) {
            alert("Bug report updated successfully");
            router.refresh();
        } else {
            alert("Failed to update bug report");
        }
    };

    if (!bugReport) return <p>Loading...</p>;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <p className="text-sm text-gray-500">
                Reported by: <strong>{maskUserID(bugReport.user_id)}</strong>
            </p>
            <h2 className="text-2xl font-semibold mb-4">{bugReport.subject}</h2>
            <p className="text-gray-700 mb-4">{bugReport.description}</p>

            <label className="block font-semibold mt-6">Update Status:</label>
            <select
                className="border p-2 rounded w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
            >
                {BUG_REPORT_STATUSES.map(({value, label}) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>

            <label className="block font-semibold mt-4">Admin Message:</label>
            <textarea className="border p-2 rounded w-full" value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}/>

            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={handleUpdate}>
                Update Report
            </button>
        </div>
    );
}
