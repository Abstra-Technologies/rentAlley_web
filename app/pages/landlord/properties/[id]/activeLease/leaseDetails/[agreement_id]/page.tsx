"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FileText,
    Info,
    CreditCard,
    Receipt,
    CheckSquare,
    ArrowLeft,
    AlertCircle,
} from "lucide-react";

import LeaseInfo from "@/components/landlord/activeLease/leaseInfo";
import LeasePayments from "@/components/landlord/activeLease/leasePayments";
import LeasePDCs from "@/components/landlord/activeLease/LeasePDCs";
import LeaseBilling from "@/components/landlord/activeLease/LeaseBilling";
import { usePropertyLeases } from "@/hooks/landlord/activeLease/usePropertyLeases";
import EKypModal from "@/components/landlord/activeLease/EKypModal";

interface LeaseDetails {
    lease_id: string;
    property_id?: number;
    property_name: string;
    unit_name: string;
    tenant_name: string;
    start_date: string;
    end_date: string;
    lease_status: string; // ⬅️ DO NOT UNION THIS
    agreement_url?: string;
}

export default function LeaseDetailsPage() {
    const { agreement_id } = useParams();
    const router = useRouter();

    const [lease, setLease] = useState<LeaseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("info");

    const [kypOpen, setKypOpen] = useState(false);
    const [selectedKypLease, setSelectedKypLease] = useState<any | null>(null);


    const { handleEndLease } = usePropertyLeases(
        lease?.property_id ? String(lease.property_id) : ""
    );

    /* ===============================
       FETCH DETAILS
    ================================ */
    useEffect(() => {
        if (!agreement_id) return;

        const fetchLeaseDetails = async () => {
            try {
                const res = await fetch(
                    `/api/leaseAgreement/getDetailedLeaseInfo/${agreement_id}`
                );
                const data = await res.json();
                setLease(data);
            } catch (err) {
                console.error("Error fetching lease details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaseDetails();
    }, [agreement_id]);

    /* ===============================
       STATE GUARDS
    ================================ */
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full">
                    <div className="flex gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                            <h3 className="font-bold text-gray-900">Lease Not Found</h3>
                            <p className="text-sm text-gray-600">
                                The lease agreement could not be found.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-lg py-2 text-sm"
                    >
                        Return
                    </button>
                </div>
            </div>
        );
    }

    /* ===============================
       NORMALIZED STATUS (🔥 FIX)
    ================================ */
    const status = lease.lease_status?.toLowerCase();
    const isActive = status === "active";
    const isExpired = status === "expired";

    /* ===============================
       HANDLERS
    ================================ */
    const handleExtendLease = () => {
        router.push(
            `/pages/landlord/properties/${lease.property_id}/activeLease/extend/${lease.lease_id}`
        );
    };

    const handleViewEKyp = () => {
        if (!lease) return;
        setSelectedKypLease(lease);
        setKypOpen(true);
    };


    /* ===============================
       RENDER
    ================================ */
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:px-8 lg:px-12 xl:px-16">
                {/* BACK */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to Leases</span>
                </button>

                {/* HEADER */}
                <div className="mb-4 flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {lease.property_name} – {lease.unit_name}
                        </h1>
                        <p className="text-sm text-gray-600">
                            Manage and review this lease agreement.
                        </p>
                    </div>
                </div>

                {/* ✅ ACTION BAR (FIXED) */}
                {(isActive || isExpired) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {isActive && (
                            <>
                                <button
                                    onClick={handleViewEKyp}
                                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    View eKYP ID
                                </button>

                                <button
                                    onClick={() => handleEndLease(lease)}
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Terminate Lease
                                </button>
                            </>
                        )}

                        {isExpired && (
                            <button
                                onClick={handleExtendLease}
                                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                Extend Lease
                            </button>
                        )}
                    </div>
                )}

                {/* TABS */}
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="border-b flex overflow-x-auto">
                        {[
                            { key: "info", label: "Info", icon: Info },
                            { key: "billing", label: "Billing", icon: Receipt },
                            { key: "payments", label: "Payments", icon: CreditCard },
                            { key: "pdcs", label: "PDCs", icon: CheckSquare },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm border-b-2 ${
                                    activeTab === key
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 md:p-6">
                        {activeTab === "info" && <LeaseInfo lease={lease} />}
                        {activeTab === "billing" && (
                            <LeaseBilling lease_id={lease.lease_id} />
                        )}
                        {activeTab === "payments" && <LeasePayments lease={lease} />}
                        {activeTab === "pdcs" && <LeasePDCs lease={lease} />}
                    </div>
                </div>
            </div>

            <EKypModal
                open={kypOpen}
                lease={selectedKypLease}
                onClose={() => {
                    setKypOpen(false);
                    setSelectedKypLease(null);
                }}
            />

        </div>


    );
}
