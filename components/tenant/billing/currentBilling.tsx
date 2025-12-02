"use client";

import React from "react";
import { useTenantBilling } from "@/hooks/tenant/useTenantBilling";
import { computeLateFee } from "@/utils/tenants/billing/computeLateFee";
import { calculateTotals } from "@/utils/tenants/billing/calculateTotals";
import { getBillingDueDate } from "@/utils/tenants/billing/formatDueDate";

import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

import BillingHeader from "./BillingHeader";
import BillingTotal from "./BillingTotal";
import RentBreakdown from "./RentBreakdown";
import UtilityBreakdown from "./UtilityBreakdown";
import PDCSection from "./PDCSection";

export default function TenantBilling({ agreement_id, user_id }) {
    const {
        billingData,
        setBillingData,
        meterReadings,
        loading,
        error,
    } = useTenantBilling(agreement_id, user_id);

    if (loading) return <LoadingScreen />;
    if (error)
        return <ErrorBoundary error={error} onRetry={() => location.reload()} />;

    if (!billingData.length)
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-bold text-gray-700">No Billing Available</h2>
                <p className="text-gray-500">Billing will appear once generated.</p>
            </div>
        );

    return (
        <div className="space-y-4">
            {billingData.map((bill) => {
                const { lateFee } = computeLateFee(bill);
                const totals = calculateTotals(bill, lateFee);
                const dueDate = getBillingDueDate(bill);

                return (
                    <div
                        key={bill.billing_id}
                        className="bg-white border rounded-2xl shadow-sm"
                    >
                        <BillingHeader bill={bill} dueDate={dueDate} />
                        <BillingTotal totalDue={totals.totalDue} />

                        <RentBreakdown
                            bill={bill}
                            totals={totals}
                            lateFee={lateFee}
                            setBillingData={setBillingData}
                        />

                        <UtilityBreakdown
                            bill={bill}
                            totals={totals}
                            meterReadings={meterReadings}
                            setBillingData={setBillingData}
                        />

                        {bill.postDatedChecks?.length > 0 && (
                            <PDCSection pdcs={bill.postDatedChecks} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
