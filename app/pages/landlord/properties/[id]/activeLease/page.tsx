"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
    FileText,
    Building2,
    User2,
    Clock,
} from "lucide-react";
import { useMemo, useState } from "react";

import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import ChecklistSetupModal from "@/components/landlord/activeLease/ChecklistModal";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function PropertyLeasesPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data, error, isLoading } = useSWR(
        `/api/landlord/activeLease/getByProperty?property_id=${id}`,
        fetcher
    );

    const [search, setSearch] = useState("");
    const [selectedLease, setSelectedLease] = useState<any>(null);
    const [setupModalLease, setSetupModalLease] = useState<any>(null);

    const leases = data?.leases || [];

    /* ===============================
       SEARCH
    =============================== */
    const filteredLeases = useMemo(() => {
        if (!search.trim()) return leases;
        const q = search.toLowerCase();
        return leases.filter((l: any) =>
            l.unit_name?.toLowerCase().includes(q) ||
            l.tenant_name?.toLowerCase().includes(q) ||
            l.invite_email?.toLowerCase().includes(q) ||
            l.lease_status?.toLowerCase().includes(q)
        );
    }, [leases, search]);

    /* ===============================
       STATUS BADGE
    =============================== */
    const getStatusBadge = (lease: any) => {
        if (lease.type === "invite") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border">
                    <Clock className="w-3 h-3" />
                    Invite Pending
                </span>
            );
        }

        if (lease.lease_status === "draft") {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border">
                    Draft
                </span>
            );
        }

        if (lease.lease_status === "pending_signature") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border">
                    <Clock className="w-3 h-3" />
                    Pending Signature
                </span>
            );
        }

        if (lease.lease_status === "active") {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                    Active
                </span>
            );
        }

        return (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border">
                {lease.lease_status}
            </span>
        );
    };

    /* ===============================
       PRIMARY ACTION HANDLER
    =============================== */
    const handlePrimaryAction = (lease: any) => {
        if (lease.lease_status === "draft") {
            setSetupModalLease(lease);
        } else {
            setSelectedLease(lease);
        }
    };

    /* ===============================
       LOADING / ERROR
    =============================== */
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-red-600 text-sm">
                    Failed to load leases. Please try again.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
            <div className="px-4 md:px-6 pt-20 md:pt-6">

                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                Current Leases
                            </h1>
                            <p className="text-xs md:text-sm text-gray-600">
                                {filteredLeases.length} records found
                            </p>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Search unit, tenant, email, status…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md px-4 py-2 text-sm border rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* ================= MOBILE ================= */}
                <div className="space-y-4 md:hidden">
                    {filteredLeases.map((lease: any) => (
                        <div
                            key={lease.lease_id || lease.invite_id}
                            className="bg-white border rounded-lg p-4 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        {lease.unit_name}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                        <User2 className="w-4 h-4" />
                                        {lease.type === "invite"
                                            ? lease.invite_email
                                            : lease.tenant_name || "—"}
                                    </p>
                                </div>
                                {getStatusBadge(lease)}
                            </div>

                            <div className="grid grid-cols-2 text-xs text-gray-600 mb-3">
                                <div>
                                    <span className="block">Start</span>
                                    <span className="font-medium">
                                        {lease.start_date
                                            ? new Date(lease.start_date).toLocaleDateString()
                                            : "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="block">End</span>
                                    <span className="font-medium">
                                        {lease.end_date
                                            ? new Date(lease.end_date).toLocaleDateString()
                                            : "—"}
                                    </span>
                                </div>
                            </div>

                            {lease.type === "lease" && (
                                <button
                                    onClick={() => handlePrimaryAction(lease)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm text-white ${
                                        lease.lease_status === "draft"
                                            ? "bg-blue-600"
                                            : "bg-gray-800"
                                    }`}
                                >
                                    {lease.lease_status === "draft"
                                        ? "Setup Lease"
                                        : "View Details"}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* ================= DESKTOP ================= */}
                <div className="hidden md:block bg-white border rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full divide-y">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3 text-left">Unit</th>
                            <th className="px-6 py-3 text-left">Tenant</th>
                            <th className="px-6 py-3 text-left">Start</th>
                            <th className="px-6 py-3 text-left">End</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {filteredLeases.map((lease: any) => (
                            <tr key={lease.lease_id || lease.invite_id}>
                                <td className="px-6 py-4 font-medium truncate">
                                    {lease.unit_name}
                                </td>
                                <td className="px-6 py-4">
                                    {lease.type === "invite"
                                        ? lease.invite_email
                                        : lease.tenant_name || "—"}
                                </td>
                                <td className="px-6 py-4">
                                    {lease.start_date
                                        ? new Date(lease.start_date).toLocaleDateString()
                                        : "—"}
                                </td>
                                <td className="px-6 py-4">
                                    {lease.end_date
                                        ? new Date(lease.end_date).toLocaleDateString()
                                        : "—"}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(lease)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {lease.type === "lease" && (
                                        <button
                                            onClick={() => handlePrimaryAction(lease)}
                                            className={`px-3 py-1.5 text-sm rounded-lg text-white ${
                                                lease.lease_status === "draft"
                                                    ? "bg-blue-600"
                                                    : "bg-gray-800"
                                            }`}
                                        >
                                            {lease.lease_status === "draft"
                                                ? "Setup"
                                                : "View"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* ================= MODALS ================= */}
                {selectedLease && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <LeaseDetailsPanel
                                lease={selectedLease}
                                onClose={() => setSelectedLease(null)}
                            />
                        </div>
                    </div>
                )}

                {setupModalLease && (
                    <ChecklistSetupModal
                        lease={setupModalLease}
                        agreement_id={setupModalLease.lease_id}
                        onClose={() => setSetupModalLease(null)}
                        onContinue={() => {
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
