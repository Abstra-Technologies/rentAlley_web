"use client";

import { useParams, useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import ChecklistSetupModal from "@/components/landlord/activeLease/ChecklistModal";
import LeaseTable from "@/components/landlord/activeLease/LeaseTable";
import LeaseStack from "@/components/landlord/activeLease/LeaseStack";
import LeaseScorecards from "@/components/landlord/activeLease/LeaseScorecards";
import EKypModal from "@/components/landlord/activeLease/EKypModal";
import {usePropertyLeases} from "@/hooks/landlord/activeLease/usePropertyLeases";


export default function PropertyLeasesPage() {
    const { id } = useParams();
    const router = useRouter();

    const {
        filteredLeases,
        stats,
        scorecards,
        search,
        setSearch,

        selectedLease,
        setSelectedLease,
        setupModalLease,
        setSetupModalLease,
        selectedKypLease,
        setSelectedKypLease,
        kypOpen,
        setKypOpen,

        isLoading,
        error,
        getStatus,
        handleEndLease,
    } = usePropertyLeases(String(id));

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

    const handleAuthenticateLease = (lease: any) => {
        router.push(
            `/pages/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`
        );
    };

    if (isLoading) return <div className="p-10">Loading...</div>;
    if (error) return <div className="p-10 text-red-600">Failed to load leases</div>;

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
                                Active Leases
                            </h1>
                            <p className="text-xs text-gray-600">
                                {filteredLeases.length} records found
                            </p>
                        </div>
                    </div>

                    <LeaseScorecards
                        total={stats?.total_leases || 0}
                        delta={stats?.total_leases_change || 0}
                        deltaPct={stats?.total_leases_change_pct || 0}
                        active={scorecards.active}
                        expiringSoon={scorecards.expiringSoon}
                        pendingSignatures={scorecards.pendingSignatures}
                    />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search unit, tenant, email, status…"
                        className="w-full max-w-md px-4 py-2 text-sm border rounded-lg"
                    />
                </div>

                <LeaseStack
                    leases={filteredLeases}
                    onPrimary={handlePrimaryAction}
                    onExtend={handleExtendLease}
                    onEnd={handleEndLease}
                    onKyp={(l) => {
                        setSelectedKypLease(l);
                        setKypOpen(true);
                    }}
                />

                <LeaseTable
                    leases={filteredLeases}
                    onPrimary={handlePrimaryAction}
                    onExtend={handleExtendLease}
                    onAuthenticate={handleAuthenticateLease}
                    onEnd={handleEndLease}
                    onKyp={(l) => {
                        setSelectedKypLease(l);
                        setKypOpen(true);
                    }}
                />

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
