"use client";

import { useParams, useRouter } from "next/navigation";
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
    Clock,
    HelpCircle,
} from "lucide-react";
import { useState } from "react";

import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import { useOnboarding } from "@/hooks/useOnboarding";
import { activeLeasesSteps } from "@/lib/onboarding/activeLeasesPage";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLeasesPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data, error, isLoading } = useSWR(
        `/api/landlord/activeLease/getByProperty?property_id=${id}`,
        fetcher
    );

    const [selectedLease, setSelectedLease] = useState<any>(null);

    const { startTour } = useOnboarding({
        tourId: "active-leases-page",
        steps: activeLeasesSteps,
        autoStart: true,
    });

    const handleAuthenticate = (lease: any) => {
        router.push(
            `/pages/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`
        );
    };

    const goToLeaseDetails = (lease: any) => {
        router.push(
            `/pages/landlord/properties/${id}/activeLease/leaseDetails/${lease.lease_id}`
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
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
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Failed to Load Leases</h3>
                            <p className="text-sm text-gray-600">
                                Please refresh the page and try again.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const leases = data?.leases || [];

    const getSignaturePendingLabel = (lease: any) => {
        if (lease.lease_status !== "pending_signature") return null;
        if (lease.landlord_signed && !lease.tenant_signed)
            return "Tenant Pending Signature";
        if (!lease.landlord_signed && lease.tenant_signed)
            return "Landlord Pending Signature";
        return "Waiting for Signatures";
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:px-8 lg:px-12 xl:px-16">

                {/* HEADER */}
                <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Current Leases
                            </h1>
                            <p className="text-sm text-gray-600">
                                {leases.length} records found
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={startTour}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Show Guide</span>
                    </button>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {leases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Unit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Start
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        End
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody className="divide-y">
                                {leases.map((lease: any) => {
                                    const sigLabel = getSignaturePendingLabel(lease);

                                    return (
                                        <tr
                                            key={lease.lease_id}
                                            className="hover:bg-gray-50 transition"
                                            onClick={() => setSelectedLease(lease)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-blue-600" />
                                                    {lease.unit_name}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                <User2 className="inline h-4 w-4 mr-1 text-gray-400" />
                                                {lease.tenant_name || lease.invite_email || "—"}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {lease.start_date
                                                    ? new Date(lease.start_date).toLocaleDateString()
                                                    : "—"}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {lease.end_date
                                                    ? new Date(lease.end_date).toLocaleDateString()
                                                    : "—"}
                                            </td>

                                            <td className="px-6 py-4">
                                                {sigLabel ? (
                                                    <span className="badge-warning">
                              <Clock className="h-3 w-3 mr-1" />
                                                        {sigLabel}
                            </span>
                                                ) : (
                                                    <span className="badge-default">
                              {lease.lease_status}
                            </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right space-y-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        goToLeaseDetails(lease);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
                                                >
                                                    <FileSignature className="w-4 h-4" />
                                                    {lease.lease_status === "active"
                                                        ? "View"
                                                        : "Open"}
                                                </button>

                                                {lease.lease_status === "pending_signature" &&
                                                    lease.tenant_signed &&
                                                    !lease.landlord_signed && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAuthenticate(lease);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                            Authenticate
                                                        </button>
                                                    )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No leases found.
                        </div>
                    )}
                </div>

                {/* DETAILS PANEL */}
                {selectedLease && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
