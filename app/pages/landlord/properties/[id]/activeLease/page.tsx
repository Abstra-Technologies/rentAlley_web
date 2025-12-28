"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { FileText, Building2, User2, Clock } from "lucide-react";
import { useMemo, useState } from "react";

import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import ChecklistSetupModal from "@/components/landlord/activeLease/ChecklistModal";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

/* ===============================
   HELPERS
================================ */
const isEndingWithin60Days = (endDate?: string | null) => {
    if (!endDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diff =
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return diff >= 0 && diff <= 60;
};

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

/* ===============================
   SIGNATURE GUARDS
================================ */
const requiresLandlordSignature = (lease: any) => {
    const status = getStatus(lease);
    return ["pending", "sent", "pending_signature"].includes(status);
};

const canModifyLease = (lease: any) => {
    const status = getStatus(lease);
    return ["active", "expired", "completed"].includes(status);
};

/* ===============================
   STATUS BADGE
================================ */
const StatusBadge = ({ lease }: { lease: any }) => {
    const base =
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border capitalize";

    if (lease.type === "invite") {
        return (
            <span className={`${base} bg-amber-100 text-amber-800 border-amber-200`}>
                <Clock className="w-3 h-3" />
                Invite Pending
            </span>
        );
    }

    const status = getStatus(lease);

    const MAP: Record<string, string> = {
        draft: "bg-blue-100 text-blue-800 border-blue-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        sent: "bg-amber-100 text-amber-800 border-amber-200",
        pending_signature: "bg-amber-100 text-amber-800 border-amber-200",
        landlord_signed: "bg-indigo-100 text-indigo-800 border-indigo-200",
        tenant_signed: "bg-indigo-100 text-indigo-800 border-indigo-200",
        completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
        active: "bg-green-100 text-green-800 border-green-200",
        expired: "bg-red-50 text-red-700 border-red-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
        <span className={`${base} ${MAP[status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
            {status?.replaceAll("_", " ") || "unknown"}
        </span>
    );
};

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

    const filteredLeases = useMemo(() => {
        if (!search.trim()) return leases;
        const q = search.toLowerCase();
        return leases.filter((l: any) =>
            l.unit_name?.toLowerCase().includes(q) ||
            l.tenant_name?.toLowerCase().includes(q) ||
            l.invite_email?.toLowerCase().includes(q) ||
            getStatus(l)?.includes(q)
        );
    }, [leases, search]);

    /* ===============================
       ACTION HANDLERS
    ================================ */
    const handlePrimaryAction = (lease: any) => {
        getStatus(lease) === "draft"
            ? setSetupModalLease(lease)
            : setSelectedLease(lease);
    };

    const handleExtendLease = (lease: any) => {
        router.push(
            `/pages/landlord/properties/${id}/activeLease/extend/${lease.lease_id}`
        );
    };

    const handleEndLease = async (lease: any) => {
        if (!confirm("Are you sure you want to permanently end this lease?")) return;

        await axios.post("/api/landlord/lease/end", {
            agreement_id: lease.lease_id,
        });

        window.location.reload();
    };

    const handleAuthenticateLease = (lease: any) => {
        router.push(
            `/pages/landlord/properties/${id}/activeLease/authenticate/${lease?.lease_id}`
        );
    };

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

                {/* HEADER */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">Current Leases</h1>
                            <p className="text-xs md:text-sm text-gray-600">
                                {filteredLeases.length} records found
                            </p>
                        </div>
                    </div>

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search unit, tenant, email, status…"
                        className="w-full max-w-md px-4 py-2 text-sm border rounded-lg
                                   focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* MOBILE */}
                <div className="space-y-4 md:hidden">
                    {filteredLeases.map((lease: any) => {
                        const status = getStatus(lease);

                        return (
                            <div key={lease.agreement_id} className="bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between mb-2">
                                    <div>
                                        <p className="font-semibold flex gap-2">
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                            {lease.unit_name}
                                        </p>
                                        <p className="text-sm text-gray-600 flex gap-2 mt-1">
                                            <User2 className="w-4 h-4" />
                                            {lease.tenant_name || "—"}
                                        </p>
                                    </div>
                                    <StatusBadge lease={lease} />
                                </div>

                                <div className="space-y-2">
                                    {requiresLandlordSignature(lease) ? (
                                        <button
                                            onClick={() => handleAuthenticateLease(lease)}
                                            className="w-full py-2 bg-indigo-600 text-white rounded-lg"
                                        >
                                            Authenticate & Sign Lease
                                        </button>
                                    ) : status === "expired" && canModifyLease(lease) ? (
                                        <>
                                            <button
                                                onClick={() => handleExtendLease(lease)}
                                                className="w-full py-2 bg-emerald-600 text-white rounded-lg"
                                            >
                                                Extend Lease
                                            </button>
                                            <button
                                                onClick={() => handleEndLease(lease)}
                                                className="w-full py-2 bg-red-600 text-white rounded-lg"
                                            >
                                                End Lease
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handlePrimaryAction(lease)}
                                                className="w-full py-2 bg-gray-800 text-white rounded-lg"
                                            >
                                                {status === "draft" ? "Setup Lease" : "View Details"}
                                            </button>

                                            {status === "active" &&
                                                isEndingWithin60Days(lease.end_date) && (
                                                    <button
                                                        onClick={() => handleExtendLease(lease)}
                                                        className="w-full py-2 bg-emerald-600 text-white rounded-lg"
                                                    >
                                                        Extend Lease
                                                    </button>
                                                )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* DESKTOP */}
                <div className="hidden md:block bg-white border rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full divide-y">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3 text-left">Unit</th>
                            <th className="px-6 py-3 text-left">Tenant</th>
                            <th className="px-6 py-3">Start</th>
                            <th className="px-6 py-3">End</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {filteredLeases.map((lease: any) => {
                            const status = getStatus(lease);

                            return (
                                <tr key={lease.agreement_id}>
                                    <td className="px-6 py-4">{lease.unit_name}</td>
                                    <td className="px-6 py-4">{lease.tenant_name || "—"} </td>
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
                                        <StatusBadge lease={lease} />
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {requiresLandlordSignature(lease) ? (
                                            <button
                                                onClick={() => handleAuthenticateLease(lease)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg"
                                            >
                                                Authenticate
                                            </button>
                                        ) : status === "expired" && canModifyLease(lease) ? (
                                            <>
                                                <button
                                                    onClick={() => handleExtendLease(lease)}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg"
                                                >
                                                    Extend
                                                </button>
                                                <button
                                                    onClick={() => handleEndLease(lease)}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg"
                                                >
                                                    End
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handlePrimaryAction(lease)}
                                                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg"
                                                >
                                                    {status === "draft" ? "Setup" : "View"}
                                                </button>

                                                {status === "active" &&
                                                    isEndingWithin60Days(lease.end_date) && (
                                                        <button
                                                            onClick={() => handleExtendLease(lease)}
                                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg"
                                                        >
                                                            Extend
                                                        </button>
                                                    )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* MODALS */}
                {selectedLease && (
                    <LeaseDetailsPanel
                        lease={selectedLease}
                        onClose={() => setSelectedLease(null)}
                    />
                )}

                {setupModalLease && (
                    <ChecklistSetupModal
                        lease={setupModalLease}
                        agreement_id={setupModalLease.agreement_id}
                        onClose={() => setSetupModalLease(null)}
                        onContinue={() => {
                            router.push(
                                `/pages/landlord/properties/${id}/activeLease/initialSetup/${setupModalLease.agreement_id}`
                            );
                            setSetupModalLease(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
