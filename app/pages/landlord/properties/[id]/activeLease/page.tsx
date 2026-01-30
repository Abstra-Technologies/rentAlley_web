"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";

import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import ChecklistSetupModal from "@/components/landlord/activeLease/ChecklistModal";

import LeaseTable from "@/components/landlord/activeLease/LeaseTable";
import LeaseStack from "@/components/landlord/activeLease/LeaseStack";
import Swal from "sweetalert2";
import EKypModal from "@/components/landlord/activeLease/EKypModal";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

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
    const [selectedKypLease, setSelectedKypLease] = useState<any | null>(null);
    const [kypOpen, setKypOpen] = useState(false);


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
        const result = await Swal.fire({
            title: "End Lease?",
            text: "This will permanently mark the lease as completed. This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, end lease",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({
                title: "Ending lease...",
                text: "Please wait while the lease is being completed.",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            await axios.post("/api/landlord/activeLease/endLease", {
                agreement_id: lease.lease_id,
            });

            Swal.fire({
                icon: "success",
                title: "Lease Completed",
                text: "The lease has been successfully ended.",
            }).then(() => {
                window.location.reload();
            });
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "Failed to End Lease",
                text:
                    err?.response?.data?.message ||
                    "Something went wrong. Please try again.",
            });
        }
    };


    const handleAuthenticateLease = (lease: any) => {
        router.push(
            `/pages/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`
        );
    };

    /* ===============================
       LOADING / ERROR
    ================================ */
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
                            <h1 className="text-xl md:text-2xl font-bold">
                                Current Leases
                            </h1>
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

                {/* MOBILE STACK */}
                <LeaseStack
                    leases={filteredLeases}
                    onPrimary={handlePrimaryAction}
                    onExtend={handleExtendLease}
                    onEnd={handleEndLease}
                    onAuthenticate={handleAuthenticateLease}
                    requiresSignature={requiresLandlordSignature}
                    canModify={canModifyLease}
                    isEndingSoon={isEndingWithin60Days}
                />

                {/* DESKTOP TABLE */}
                <LeaseTable
                    leases={filteredLeases}
                    onPrimary={handlePrimaryAction}
                    onExtend={handleExtendLease}
                    onEnd={handleEndLease}
                    onKyp={(lease) => {
                        setSelectedKypLease(lease);
                        setKypOpen(true);
                    }}
                />


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
                                `/pages/landlord/properties/${id}/activeLease/initialSetup/${setupModalLease?.lease_id}`
                            );
                            setSetupModalLease(null);
                        }}
                    />
                )}

                <EKypModal
                    open={kypOpen}
                    lease={selectedKypLease}
                    onClose={() => {
                        setKypOpen(false);
                        setSelectedKypLease(null);
                    }}
                />

            </div>
        </div>
    );
}
