"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
    FileText,
    Building2,
    User2,
    AlertCircle,
    FileSignature,
    Eye,
    ShieldCheck
} from "lucide-react";

import { useState } from "react";
import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import {useRouter } from "next/navigation";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLeasesPage() {
    const { id } = useParams();
    const { data, error, isLoading } = useSWR(
        `/api/landlord/activeLease/getByProperty?property_id=${id}`,
        fetcher
    );
    const router = useRouter();

    const [selectedLease, setSelectedLease] = useState(null);

    const handleLeaseAction = (lease) => {
        setSelectedLease(lease);
    };

    const handleAuthenticate = (lease) => {
        router.push(`/pages/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading leases...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-md w-full">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                Failed to Load Leases
                            </h3>
                            <p className="text-sm text-gray-600">
                                Unable to fetch lease information. Please try again later.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const leases = data?.leases || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Current Leases
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {leases.length} {leases.length === 1 ? "lease" : "leases"} found
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leases Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {leases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Unit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        End Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {leases.map((lease) => (
                                    <tr
                                        key={lease.lease_id}
                                        onClick={() => setSelectedLease(lease)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium text-gray-900">
                            {lease.unit_name}
                          </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User2 className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">
                            {lease.tenant_name}
                          </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(lease.start_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(lease.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                       <span
                           className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
    ${
                               lease.lease_status === "active"
                                   ? "bg-green-100 text-green-800 border border-green-200"
                                   : lease.lease_status === "pending_signature"
                                       ? "bg-amber-100 text-amber-800 border border-amber-200"
                                       : lease.lease_status === "draft"
                                           ? "bg-blue-100 text-blue-800 border border-blue-200"
                                           : lease.lease_status === "expired"
                                               ? "bg-gray-200 text-gray-700 border border-gray-300"
                                               : lease.lease_status === "cancelled"
                                                   ? "bg-red-100 text-red-700 border border-red-200"
                                                   : "bg-gray-100 text-gray-700 border border-gray-200"
                           }`}
                       >
  {lease.lease_status === "pending_signature"
      ? "Pending Signature"
      : lease.lease_status.charAt(0).toUpperCase() +
      lease.lease_status.slice(1)}
</span>

                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {lease.lease_status === "draft" ? (
                                                // 🟦 DRAFT → Setup button
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLeaseAction(lease);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white transition-all shadow-sm"
                                                >
                                                    <FileSignature className="w-4 h-4" />
                                                    Setup
                                                </button>
                                            ) : lease.lease_status === "pending_signature" ? (
                                                // 🟡 PENDING SIGNATURE → Authenticate button
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAuthenticate(lease); // ⚙️ Create this handler for OTP/auth flow
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all shadow-sm"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                    Authenticate Document
                                                </button>
                                            ) : lease.lease_status === "active" ? (
                                                // 🟢 ACTIVE → View Details
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLeaseAction(lease);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm bg-gray-700 hover:bg-gray-800 text-white transition-all shadow-sm"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                            ) : (
                                                // — For all other statuses
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="max-w-md mx-auto">
                                <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
                                    <FileText className="h-10 w-10 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    No leases found
                                </h3>
                                <p className="text-sm text-gray-600">
                                    There are currently no lease agreements for this property.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Side Details Panel */}
                {selectedLease && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <LeaseDetailsPanel
                                lease={selectedLease}
                                onClose={() => setSelectedLease(null)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
