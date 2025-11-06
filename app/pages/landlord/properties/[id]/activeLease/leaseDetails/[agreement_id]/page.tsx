
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
import { BackButton } from "@/components/navigation/backButton";
import LoadingScreen from "@/components/loadingScreen";

import LeaseInfo from "@/components/landlord/activeLease/leaseInfo";
import LeasePayments from "@/components/landlord/activeLease/leasePayments";
// import LeaseBilling from "./LeaseBilling";
// import LeasePayments from "./LeasePayments";
// import LeaseRequests from "./LeaseRequests";
import LeasePDCs from "@/components/landlord/activeLease/LeasePDCs";

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
    rent_amount?: number;
    email?: string; // Added
    phoneNumber?: string; // Added
    pdcs?: {
        pdc_id: number;
        check_number: string;
        bank_name: string;
        amount: number;
        due_date: string;
        uploaded_image_url:string;
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

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
                <LoadingScreen message='Just a moment, getting things ready...' />;
            </div>
        );
    }

    if (!lease) {
        return (
            <Box className="fixed inset-0 flex items-center justify-center p-4 bg-gray-100">
                <Box className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg text-center space-y-4">
                    <Typography variant="h6" className="font-semibold text-red-600">
                        Lease Not Found
                    </Typography>
                    <Typography variant="body1" className="text-gray-600">
                        The lease agreement you're looking for could not be found. Please check the agreement ID or try again later.
                    </Typography>
                    <BackButton label="Return to Dashboard" />
                </Box>
            </Box>
        );
    }

    return (
        <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 p-4 sm:p-6 rounded-t-2xl shadow-inner space-y-6">
            {/* Back Navigation */}
            <div className="flex items-center justify-between">
                <BackButton
                    label="Go Back"
                    fallback={`/pages/landlord/properties/${lease.property_id}/activeLease`}
                />
            </div>

            {/* Header Section */}
            <div className="space-y-3 text-center sm:text-left">
                <h4 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    {lease.property_name} - {lease.unit_name}
                </h4>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    className="text-gray-600 text-sm sm:text-base leading-relaxed"
                >
                    Manage and review this lease agreement. <br className="sm:hidden" />
                    All details displayed are based on the current document. Notify the
                    tenant for any modifications.
                </Typography>
            </div>

            <Divider className="border-gray-200" />

            {/* Tabs Navigation */}
            <div className="w-full overflow-x-auto scrollbar-hide">
                <Tabs
                    value={tab}
                    onChange={(_, newValue) => setTab(newValue)}
                    textColor="primary"
                    indicatorColor="primary"
                    className="flex min-w-max justify-between sm:justify-start"
                >
                    <Tab
                        label="Info"
                        className="text-xs sm:text-sm font-semibold px-3 sm:px-6"
                    />
                    <Tab
                        label="Billing Statements"
                        className="text-xs sm:text-sm font-semibold px-3 sm:px-6"
                    />
                    <Tab
                        label="Payments"
                        className="text-xs sm:text-sm font-semibold px-3 sm:px-6"
                    />
                    <Tab
                        label="PDCs"
                        className="text-xs sm:text-sm font-semibold px-3 sm:px-6"
                    />
                </Tabs>
            </div>

            {/* Tab Contents */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-md p-4 sm:p-6 transition-all duration-300">
                {tab === 0 && (
                    <div className="animate-fadeIn">
                        <LeaseInfo lease={lease} />
                    </div>
                )}
                {tab === 1 && (
                    <div className="animate-fadeIn">
                        {/* Reserved for Billing Statements */}
                    </div>
                )}
                {tab === 2 && (
                    <div className="animate-fadeIn">
                        <LeasePayments lease={lease} />
                    </div>
                )}
                {tab === 3 && (
                    <div className="animate-fadeIn">
                        <LeasePDCs lease={lease} />
                    </div>
                )}
            </div>
        </Box>
    );

}