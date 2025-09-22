"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    Typography,
    Divider,
    Tabs,
    Tab,
} from "@mui/material";

interface BillingDetail {
    billing_id: number;
    billing_period: string;
    total_amount_due: number;
    status: string;
    due_date: string;
}

interface LeaseDetails {
    lease_id: number;
    property_name: string;
    unit_name: string;
    tenant_name: string;
    start_date: string;
    end_date: string;
    lease_status: "pending" | "active" | "expired" | "cancelled";
    agreement_url?: string;
    security_deposit_amount?: number;
    advance_payment_amount?: number;
    grace_period_days?: number;
    late_penalty_amount?: number;
    billing_due_day?: number;
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
    billing?: BillingDetail[];
}

export default function LeaseDetailsPage() {
    const { agreement_id } = useParams();
    const [lease, setLease] = useState<LeaseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);

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
                    Lease Details {lease.property_name} -{" "} {lease.unit_name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Manage and review this lease agreement.
                </Typography>
            </div>

            <Divider />

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, newValue) => setTab(newValue)}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="Info" />
                <Tab label="Billing Statements" />
                <Tab label="Payments" />
                <Tab label="Requests" />
                <Tab label="PDCs" />

            </Tabs>

            {/* Info Tab */}
            {tab === 0 && (
                <Box className="space-y-6 text-gray-700 mt-4">
                    {/* Overview Section */}
                    <div className="p-4 border rounded-lg shadow-sm bg-white">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <p>
                                <strong>Property / Unit:</strong> {lease.property_name} – {lease.unit_name}
                            </p>
                            <p>
                                <strong>Tenant:</strong> {lease.tenant_name}
                            </p>
                            <p>
                                <strong>Lease Period:</strong> {lease.start_date} → {lease.end_date}
                            </p>
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
                    </div>

                    {/* Financial Terms Section */}
                    <div className="p-4 border rounded-lg shadow-sm bg-white">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">Financial Terms</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <p>
                                <strong>Security Deposit:</strong> ₱
                                {lease.security_deposit_amount?.toLocaleString() || 0}
                            </p>
                            <p>
                                <strong>Advance Payment:</strong> ₱
                                {lease.advance_payment_amount?.toLocaleString() || 0}
                            </p>
                            <p>
                                <strong>Billing Due Day:</strong> {lease.billing_due_day || "Not set"}
                            </p>
                            <p>
                                <strong>Grace Period:</strong> {lease.grace_period_days || 0} days
                            </p>
                            <p>
                                <strong>Late Penalty:</strong> ₱
                                {lease.late_penalty_amount?.toLocaleString() || 0} per day
                            </p>
                        </div>
                    </div>
                </Box>
            )}


            {/* Billing Terms Tab */}
            {tab === 1 && (
                <Box className="space-y-2 text-gray-700 mt-4">

                </Box>
            )}

            {/* PDCs Tab */}
            {tab === 2 && (
                <Box className="mt-4">
                    {lease.pdcs && lease.pdcs.length > 0 ? (
                        <ul className="list-disc pl-6 space-y-1">
                            {lease.pdcs.map((pdc) => (
                                <li key={pdc.pdc_id}>
                                    #{pdc.check_number} - ₱
                                    {pdc.amount.toLocaleString()} ({pdc.bank_name}) due{" "}
                                    {pdc.due_date} →{" "}
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
            )}

            {/* Payments Tab */}
            {tab === 3 && (
                <Box className="mt-4">
                    {lease.payments && lease.payments.length > 0 ? (
                        <ul className="list-disc pl-6 space-y-1">
                            {lease.payments.map((pay) => (
                                <li key={pay.payment_id}>
                                    ₱{pay.amount.toLocaleString()} via {pay.method} on{" "}
                                    {pay.paid_on} →{" "}
                                    <span className="text-sm text-gray-600">{pay.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <span className="text-gray-400 italic">No payments recorded.</span>
                    )}
                </Box>
            )}
        </Box>
    );
}
