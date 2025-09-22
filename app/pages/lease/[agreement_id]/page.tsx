
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, CircularProgress, Typography, Divider, Chip } from "@mui/material";
import LoadingScreen from "@/components/loadingScreen";

interface LeaseDetails {
    lease_id: number;
    property_name: string;
    unit_name: string;
    tenant_name: string;
    start_date: string;
    end_date: string;
    lease_status: "pending" | "active" | "expired";
    agreement_url?: string;
    security_deposit?: number;
    advance_payment?: number;
    pdcs?: {
        pdc_id: number;
        check_number: string;
        bank_name: string;
        amount: number;
        due_date: string;
        status: "pending" | "cleared" | "bounced" | "replaced";
    }[];
    payments?: {
        payment_id: number;
        amount: number;
        method: string;
        paid_on: string;
        status: string;
    }[];
}

export default function LeaseDetailsPage() {
    const { agreement_id } = useParams();
    const [lease, setLease] = useState<LeaseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    console.log('Lease ID', agreement_id);

    useEffect(() => {
        if (!agreement_id) return;

        const fetchLeaseDetails = async () => {
            try {
                const res = await fetch(`/api/leaseAgreement/getDetailedLeaseInfo/${agreement_id}`);
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

    // if (loading) {
    //     return (
    //         <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
    //              <LoadingScreen message='Just a moment, getting the lease info. ready...' />;
    //         </div>
    //     );
    // }

    if (!lease) {
        return (
            <Box className="p-6">
                <Typography variant="h6" color="error">
                    Lease not found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box className="p-6 space-y-6">
            {/* Title */}
            <div>
                <Typography variant="h4" fontWeight="bold">
                    Lease Details
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Manage and review this lease agreement.
                </Typography>
            </div>

            {/* Overview */}
            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Overview
                </Typography>
                <div className="space-y-2 text-gray-700">
                    <p>
                        <strong>Property / Unit:</strong> {lease.property_name} - {lease.unit_name}
                    </p>
                    <p>
                        <strong>Tenant:</strong> {lease.tenant_name}
                    </p>
                    <p>
                        <strong>Lease Period:</strong> {lease.start_date} → {lease.end_date}
                    </p>
                    {/*<p>*/}
                    {/*    <strong>Status:</strong>{" "}*/}
                    {/*    <Chip*/}
                    {/*        label={lease.lease_status.charAt(0).toUpperCase() + lease.lease_status.slice(1)}*/}
                    {/*        color={*/}
                    {/*            lease.lease_status === "active"*/}
                    {/*                ? "success"*/}
                    {/*                : lease.lease_status === "pending"*/}
                    {/*                    ? "warning"*/}
                    {/*                    : "error"*/}
                    {/*        }*/}
                    {/*    />*/}
                    {/*</p>*/}
                    <p>
                        <strong>Agreement Document:</strong>{" "}
                        {lease.agreement_url ? (
                            <a
                                href={lease.agreement_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                View
                            </a>
                        ) : (
                            <span className="text-gray-400 italic">N/A</span>
                        )}
                    </p>
                </div>
            </Box>

            <Divider />

            {/* Deposits */}
            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Deposits
                </Typography>
                <div className="space-y-2 text-gray-700">
                    <p>
                        <strong>Security Deposit:</strong> ₱{lease.security_deposit?.toLocaleString() || 0}
                    </p>
                    <p>
                        <strong>Advance Payment:</strong> ₱{lease.advance_payment?.toLocaleString() || 0}
                    </p>
                </div>
            </Box>

            <Divider />

            {/* PDCs */}
            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Post-Dated Checks
                </Typography>
                {lease.pdcs && lease.pdcs.length > 0 ? (
                    <ul className="list-disc pl-6 space-y-1">
                        {lease.pdcs.map((pdc) => (
                            <li key={pdc.pdc_id}>
                                #{pdc.check_number} - ₱{pdc.amount.toLocaleString()} ({pdc.bank_name}){" "}
                                due {pdc.due_date} →{" "}
                                <span
                                    className={`px-2 py-0.5 rounded text-xs ${
                                        pdc.status === "cleared"
                                            ? "bg-green-100 text-green-700"
                                            : pdc.status === "bounced"
                                                ? "bg-red-100 text-red-700"
                                                : pdc.status === "replaced"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-700"
                                    }`}
                                >
                  {pdc.status}
                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span className="text-gray-400 italic">No PDCs recorded.</span>
                )}
            </Box>

            <Divider />

            {/* Payments */}
            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Payment History
                </Typography>
                {lease.payments && lease.payments.length > 0 ? (
                    <ul className="list-disc pl-6 space-y-1">
                        {lease.payments.map((pay) => (
                            <li key={pay.payment_id}>
                                ₱{pay.amount.toLocaleString()} via {pay.method} on {pay.paid_on} →{" "}
                                <span className="text-sm text-gray-600">{pay.status}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span className="text-gray-400 italic">No payments recorded.</span>
                )}
            </Box>
        </Box>
    );
}
