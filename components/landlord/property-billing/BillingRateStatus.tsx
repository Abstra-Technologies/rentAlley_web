"use client";

import { CheckCircle, AlertCircle } from "lucide-react";

export default function BillingRateStatus({
                                              propertyDetails,
                                              hasBillingForMonth,
                                              billingData,
                                          }: any) {
    if (
        !propertyDetails ||
        (propertyDetails.water_billing_type !== "submetered" &&
            propertyDetails.electricity_billing_type !== "submetered")
    )
        return null;

    const startDate =
        billingData?.period_start &&
        !isNaN(new Date(billingData.period_start).getTime())
            ? new Date(billingData.period_start)
            : null;

    const endDate =
        billingData?.period_end &&
        !isNaN(new Date(billingData.period_end).getTime())
            ? new Date(billingData.period_end)
            : null;

    const formattedRange =
        startDate && endDate
            ? `${startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            })} – ${endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            })}`
            : null;

    return (
        <div
            id="rate-status-indicator"
            className={`rounded-lg border-l-4 p-4 ${
                hasBillingForMonth
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-amber-500 bg-amber-50"
            }`}
        >
            <div className="flex items-start gap-3">
                {hasBillingForMonth ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                )}

                <div>
                    <p className="text-sm font-semibold">
                        {hasBillingForMonth ? "Utility Rates Already Set" : "Rates Not Set"}
                    </p>

                    <p className="text-xs mt-1">
                        {hasBillingForMonth && formattedRange
                            ? `Configured for ${formattedRange}`
                            : "Configure rates to enable billing"}
                    </p>
                </div>
            </div>
        </div>
    );
}
