
"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";

interface LeaseHistory {
    agreement_id: number;
    start_date: string;
    end_date: string;
    status: "active" | "expired" | "cancelled";
    unit_name: string;
    property_name: string;
}

export default function TenantUnitHistory() {
    const { user } = useAuthStore();
    const [history, setHistory] = useState<LeaseHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/tenant/history/unit-history?tenant_id=${user?.tenant_id}`);
                const data = await res.json();
                if (res.ok) {
                    setHistory(data.history);
                }
            } catch (error) {
                console.error("Error fetching unit history:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.tenant_id) {
            fetchHistory();
        }
    }, [user?.tenant_id]);

    if (loading) {
        return <LoadingScreen message="Fetching your unit history..." />;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <TenantOutsidePortalNav />

            {/* Main Content */}
            <div className="flex-1 md:ml-64 p-4 sm:p-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h1 className="gradient-header">Unit History</h1>
                    <p className="text-gray-600 mt-1">View your past and current rental units</p>
                </div>

                {history.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="text-gray-400 text-6xl mb-4">🏠</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rental History</h3>
                        <p className="text-gray-600">You haven’t rented any units yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Property</th>
                                <th className="px-6 py-3">Unit</th>
                                <th className="px-6 py-3">Start Date</th>
                                <th className="px-6 py-3">End Date</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {history.map((lease) => (
                                <tr key={lease.agreement_id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-3">{lease.property_name}</td>
                                    <td className="px-6 py-3">{lease.unit_name}</td>
                                    <td className="px-6 py-3">
                                        {lease.start_date ? new Date(lease.start_date).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="px-6 py-3">
                                        {lease.end_date ? new Date(lease.end_date).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="px-6 py-3">
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
                        ${
                            lease.status === "active"
                                ? "bg-green-100 text-green-700"
                                : lease.status === "expired"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-red-100 text-red-700"
                        }`}
                    >
                      {lease.status}
                    </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

}
