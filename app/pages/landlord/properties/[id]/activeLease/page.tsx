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
    ShieldCheck,
    MailCheck,
    Clock
} from "lucide-react";

import { useState } from "react";
import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import ChecklistSetupModal from "@/components/landlord/activeLease/ChecklistModal"; // ⬅ ADDED
import { useRouter } from "next/navigation";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLeasesPage() {
    const { id } = useParams();
    const { data, error, isLoading } = useSWR(
        `/api/landlord/activeLease/getByProperty?property_id=${id}`,
        fetcher
    );
    const router = useRouter();

    const [selectedLease, setSelectedLease] = useState(null);

    // NEW STATE FOR SETUP MODAL
    const [setupModalLease, setSetupModalLease] = useState(null);

    const handleLeaseAction = (lease) => {
        setSelectedLease(lease);
    };

    const handleAuthenticate = (lease) => {
        router.push(
            `/pages/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`
        );
    };

    // ========== Loading ==========
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

    // ========== Error ==========
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

                {/* HEADER */}
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
                                {leases.length} records found
                            </p>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {leases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                {leases.map((lease) => (
                                    <tr
                                        key={lease.lease_id || `invite-${lease.invite_id}`}
                                        onClick={() =>
                                            lease.type === "lease" &&
                                            setSelectedLease(lease)
                                        }
                                        className={`transition-colors ${
                                            lease.type === "lease"
                                                ? "hover:bg-gray-50 cursor-pointer"
                                                : "bg-amber-50/30"
                                        }`}
                                    >
                                        {/* UNIT */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium text-gray-900">
                                                        {lease.unit_name}
                                                    </span>
                                            </div>
                                        </td>

                                        {/* TENANT */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User2 className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">
                                                        {lease.type === "invite"
                                                            ? lease.invite_email
                                                            : lease.tenant_name || "—"}
                                                    </span>
                                            </div>
                                        </td>

                                        {/* DATES */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {lease.start_date
                                                ? new Date(lease.start_date).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {lease.end_date
                                                ? new Date(lease.end_date).toLocaleDateString()
                                                : "—"}
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {lease.type === "invite" ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                        <Clock className="h-3 w-3" />
                                                        Waiting for Tenant to Accept Invite
                                                    </span>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                                                            ${
                                                        lease.lease_status === "active"
                                                            ? "bg-green-100 text-green-800 border border-green-200"
                                                            : lease.lease_status ===
                                                            "pending_signature"
                                                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                                : lease.lease_status === "draft"
                                                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                                    }
                                                        `}
                                                >
                                                        {lease.lease_status
                                                            ? lease.lease_status.charAt(0).toUpperCase() +
                                                            lease.lease_status.slice(1)
                                                            : "Draft"}
                                                    </span>
                                            )}
                                        </td>

                                        {/* ACTION BUTTONS */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                                            {/* INVITE ROW */}
                                            {lease.type === "invite" ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm bg-amber-500/80 text-white shadow-sm">
            <MailCheck className="w-4 h-4" />
            Invite Sent
        </span>
                                            ) : lease.lease_status === "active" ? (
                                                // 🟩 View Details (ACTIVE ONLY)
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedLease(lease);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm bg-gray-700 hover:bg-gray-800 text-white transition-all shadow-sm"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                            ) : (
                                                // 🟦 SETUP BUTTON (SHOW UNTIL ACTIVE)
                                                <div className="flex flex-col items-end gap-2">

                                                    {/* Setup button always visible unless active */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSetupModalLease(lease);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm
                            bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700
                            text-white transition-all shadow-sm"
                                                    >
                                                        <FileSignature className="w-4 h-4" />
                                                        Setup
                                                    </button>

                                                    {/* Authenticate button appears when pending_signature */}
                                                    {lease.lease_status === "pending_signature" && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAuthenticate(lease);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm
                                bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
                                text-white transition-all shadow-sm"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                            Authenticate
                                                        </button>
                                                    )}
                                                </div>
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
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No records found</h3>
                                <p className="text-sm text-gray-600">
                                    There are no leases or pending invites for this property.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* DETAILS PANEL */}
                {selectedLease && selectedLease.type === "lease" && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <LeaseDetailsPanel
                                lease={selectedLease}
                                onClose={() => setSelectedLease(null)}
                            />
                        </div>
                    </div>
                )}

                {/* SETUP CHECKLIST MODAL */}
                {setupModalLease && (
                    <ChecklistSetupModal
                        lease={setupModalLease}
                        agreement_id={setupModalLease.lease_id}
                        onClose={() => setSetupModalLease(null)}
                        onContinue={(requirements) => {
                            router.push(
                                `/pages/landlord/properties/${id}/activeLease/initialSetup/${setupModalLease.lease_id}`
                            );
                            setSetupModalLease(null);
                        }}
                    />

                )}
            </div>
        </div>
    );
}
