"use client";

import React from "react";
import { useTenantBilling } from "@/hooks/tenant/useTenantBilling";
import { computeLateFee } from "@/utils/tenants/billing/computeLateFee";
import { calculateTotals } from "@/utils/tenants/billing/calculateTotals";
import { getBillingDueDate } from "@/utils/tenants/billing/formatDueDate";
import { formatDate } from "@/utils/formatter/formatters";

import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

import RentBreakdown from "./RentBreakdown";
import UtilityBreakdown from "./UtilityBreakdown";
import PDCSection from "./PDCSection";
import PaymentSection from "./PaymentSection";

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
        return (
            <ErrorBoundary
                error={error}
                onRetry={() => location.reload()}
            />
        );

    if (!billingData.length)
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-bold text-gray-700">
                    No Billing Available
                </h2>
                <p className="text-gray-500">
                    Billing will appear once generated.
                </p>
            </div>
        );

    return (
        <div className="space-y-4">
            {billingData.map((bill) => {
                const { lateFee } = computeLateFee(bill);
                const totals = calculateTotals(bill, lateFee);
                const dueDate = getBillingDueDate(bill);

                /* --------------------------------------------------
                   🔑 FIX: scope meter readings PER BILLING PERIOD
                -------------------------------------------------- */
                const billDate = new Date(bill.billing_period);
                const billMonth = billDate.getMonth();
                const billYear = billDate.getFullYear();

                const scopedMeterReadings = (meterReadings || []).filter(
                    (r) => {
                        if (!r?.reading_date) return false;
                        const d = new Date(r.reading_date);
                        return (
                            d.getMonth() === billMonth &&
                            d.getFullYear() === billYear
                        );
                    }
                );

                return (
                    <div
                        key={bill.billing_id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                    >
                        {/* ================= HEADER ================= */}
                        <div className="px-4 py-3 border-b bg-gray-50">
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDate(bill.billing_period)}
                            </p>
                            <p className="text-xs text-gray-500">
                                Due {formatDate(dueDate)}
                            </p>
                        </div>

                        {/* ================= TOTAL ================= */}
                        <div className="px-4 py-3 flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-medium">
                                Total Amount Due
                            </span>
                            <span className="text-lg font-bold text-emerald-600">
                                ₱{totals.totalDue.toFixed(2)}
                            </span>
                        </div>

                        {/* ================= DETAILS ================= */}
                        <div className="px-4 pb-4 space-y-4">
                            <RentBreakdown
                                bill={bill}
                                totals={totals}
                                lateFee={lateFee}
                                setBillingData={setBillingData}
                            />

                            <UtilityBreakdown
                                bill={bill}
                                totals={totals}
                                meterReadings={scopedMeterReadings}
                                setBillingData={setBillingData}
                            />

                            {bill.postDatedChecks?.length > 0 && (
                                <PDCSection
                                    pdcs={bill.postDatedChecks}
                                />
                            )}
                        </div>

                        {/* ================= PAYMENT ================= */}
                        <div className="px-4 py-3 border-t bg-gray-50">
                            <PaymentSection
                                bill={bill}
                                totalDue={totals.totalDue}
                                agreement_id={agreement_id}
                                compact
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
