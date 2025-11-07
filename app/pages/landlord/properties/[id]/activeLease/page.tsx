"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
    FileText,
    Building2,
    User2,
    CalendarDays,
    BetweenHorizontalStart,
    CirclePlay,
} from "lucide-react";
import { useState } from "react";
import LeaseSetupModal from "@/components/landlord/activeLease/SetupLeaseModal";
import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLeasesPage() {
    const { id } = useParams();
    const { data, error, isLoading } = useSWR(
        `/api/landlord/activeLease/getByProperty?property_id=${id}`,
        fetcher
    );
    const router = useRouter();

    const [showSetupModal, setShowSetupModal] = useState(false);
    const [selectedLease, setSelectedLease] = useState(null);

    const handleSetupClick = (lease) => {
        const agreementId = lease.agreement_id || lease.lease_id;
        setSelectedLease({ ...lease, agreement_id: agreementId });
        setShowSetupModal(true);
    };

    const handleLeaseClick = (lease) => {
        if (lease.lease_status === "active") {
            router.push(
                `/pages/landlord/properties/${id}/activeLease/leaseDetails/${
                    lease.agreement_id || lease.lease_id
                }`
            );
        }
    };

    if (isLoading)
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
                <p className="text-gray-600 font-medium animate-pulse">
                    Loading leases...
                </p>
            </div>
        );

    if (error)
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
                <p className="text-red-600 font-semibold">
                    ⚠️ Failed to load leases. Please try again.
                </p>
            </div>
        );

    const leases = data?.leases || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-0 sm:p-0">
            <div className="w-full bg-white border-t border-gray-100 shadow-inner rounded-none p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        Current Leases
                    </h1>
                    <p className="hidden sm:block text-sm text-gray-500">
                        {leases.length} {leases.length === 1 ? "lease" : "leases"} found
                    </p>
                </div>

                {/* Layout Split */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Table */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-2 sm:p-4 overflow-x-auto">
                        <table className="min-w-full text-sm border-collapse">
                            <thead className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold">Unit</th>
                                <th className="text-left py-3 px-4 font-semibold">Start</th>
                                <th className="text-left py-3 px-4 font-semibold">End</th>
                                <th className="text-left py-3 px-4 font-semibold">Status</th>
                                <th className="text-center py-3 px-4 font-semibold">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {leases.map((lease) => (
                                <tr
                                    key={lease.lease_id}
                                    onClick={() => setSelectedLease(lease)}
                                    className="border-b bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:shadow-md hover:shadow-blue-100/70 transition-all duration-300 cursor-pointer"
                                >
                                    <td className="py-3 px-4 text-gray-800 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        {lease.unit_name}
                                    </td>
                                    <td className="py-3 px-4 text-gray-700 flex items-center gap-2">
                                        <User2 className="w-4 h-4 text-emerald-500" />
                                        {lease.tenant_name}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {new Date(lease.start_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {new Date(lease.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4">
                      <span
                          className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                              lease.lease_status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : lease.lease_status === "pending"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : lease.lease_status === "draft"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {lease.lease_status}
                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {lease.lease_status === "draft" ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSetupClick(lease);
                                                }}
                                                className="px-5 py-3 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <BetweenHorizontalStart className="w-4 h-4 inline mr-1" />
                                                Setup Lease
                                            </button>
                                        ) : lease.lease_status === "active" ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLeaseClick(lease);
                                                }}
                                                className="px-5 py-3 text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <CirclePlay className="w-4 h-4 inline mr-1" />
                                                View Lease
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Side Details Panel */}
                    {selectedLease && (
                        <LeaseDetailsPanel
                            lease={selectedLease}
                            onClose={() => setSelectedLease(null)}
                        />
                    )}
                </div>
            </div>

            <LeaseSetupModal
                isOpen={showSetupModal}
                agreement_id={selectedLease?.agreement_id}
                onClose={() => setShowSetupModal(false)}
            />
        </div>
    );
}
