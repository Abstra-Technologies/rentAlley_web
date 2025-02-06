// "use client";
// import { useRouter } from "next/navigation";
// import useAuth from "../../../../../../hooks/useSession";
// import useSWR from "swr";
//
// // Fetch function for SWR
// const fetcher = async (url) => {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error("Failed to fetch bug reports");
//     return res.json();
// };
//
// export default function BugReports() {
//     const { user } = useAuth();
//     const router = useRouter();
//
//     // Use SWR to fetch bug reports
//     const { data, error, isLoading } = useSWR("/api/systemadmin/bugReport/list", fetcher, { refreshInterval: 5000 });
//
//     if (error) return <p className="text-red-500 text-center">Failed to load bug reports.</p>;
//     if (isLoading) return <p className="text-center text-gray-500">Loading bug reports...</p>;
//
//     return (
//         <div className="p-6">
//             <h2 className="text-xl font-semibold mb-4">Bug Reports</h2>
//
//             {data.bugReports.length === 0 ? (
//                 <p className="text-center text-gray-500">No bug reports found</p>
//             ) : (
//                 <div className="overflow-x-auto border border-gray-300 rounded-lg">
//                     <table className="table-auto w-full">
//                         <thead>
//                         <tr className="border-b border-gray-300 bg-gray-100">
//                             <th className="px-4 py-2">#</th>
//                             <th className="px-4 py-2">Subject</th>
//                             <th className="px-4 py-2">Description</th>
//                             <th className="px-4 py-2">Reported By</th>
//                             <th className="px-4 py-2">Status</th>
//                             <th className="px-4 py-2">Created At</th>
//                         </tr>
//                         </thead>
//                         <tbody>
//
//                         {data.bugReports.length > 0 ? (
//                             data.bugReports.map((reports: { report_id: number; user_id: string; subject: string; description: string; created_at: string }, index: number) => (
//                                 <tr key={reports.report_id ?? `temp-key-${index}`}>
//                                     <td>{index + 1}</td>
//                                     <td
//                                         className="px-4 py-2 text-blue-500 cursor-pointer hover:underline"
//                                         onClick={() => router.push(`./${reports.report_id}`)}
//                                     >
//                                         {reports.subject}
//                                     </td>
//                                     <td>{reports.description}</td>
//                                     <td>{reports.user_id || "N/A"}</td>
//                                     <td>{reports.status}</td>
//                                     <td>{reports.created_at || "N/A"}</td>
//                                     <td>{new Date(reports.created_at).toLocaleString()}</td>
//                                 </tr>
//                             ))
//                         ) : (
//                             <tr>
//                                 <td colSpan="6">No Bug Reports found.</td>
//                             </tr>
//                         )}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// }
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch bug reports");
    return res.json();
};

export default function BugReports() {
    const router = useRouter();
    const { data, error, isLoading } = useSWR("/api/systemadmin/bugReport/list", fetcher, { refreshInterval: 5000 });

    const [searchQuery, setSearchQuery] = useState("");

    if (error) return <p className="text-red-500 text-center">Failed to load bug reports.</p>;
    if (isLoading) return <p className="text-center text-gray-500">Loading bug reports...</p>;

    // Function to filter bug reports based on search query
    const filteredBugReports = data.bugReports.filter((report: any) =>
        report.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bug Reports</h2>

            {/* Search Bar */}
            <input
                type="text"
                placeholder="Search by subject or description..."
                className="border p-2 w-full rounded mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {filteredBugReports.length === 0 ? (
                <p className="text-center text-gray-500">No bug reports found</p>
            ) : (
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="table-auto w-full">
                        <thead>
                        <tr className="border-b border-gray-300 bg-gray-100">
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Reported By</th>
                            <th className="px-4 py-2">Created At</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredBugReports.map((report: any, index: number) => (
                                <tr key={report.report_id ?? `temp-key-${index}`}className="border-b">
                                    <td className="px-4 py-2">{index + 1}</td>
                                    <td
                                        className="px-4 py-2 text-blue-500 cursor-pointer hover:underline"
                                        onClick={() => router.push(`/admin/bugReports/${report.reportID}`)}
                                    >
                                        {report.subject}
                                    </td>
                                    <td className="px-4 py-2">{report.status}</td>
                                    <td className="px-4 py-2">{report.User_userID || "N/A"}</td>
                                    <td className="px-4 py-2">{new Date(report.createdAt).toLocaleString()}</td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                            </div>
            )}
        </div>
    );
}
