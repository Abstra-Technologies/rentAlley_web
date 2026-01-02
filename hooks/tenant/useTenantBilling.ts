"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export function useTenantBilling(agreement_id?: string, user_id?: string) {
    const [billingData, setBillingData] = useState<any[]>([]);
    const [meterReadings, setMeterReadings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user_id && !agreement_id) {
            setLoading(false);
            setBillingData([]);
            setMeterReadings([]);
            return;
        }

        const fetchBilling = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await axios.get(
                    "/api/tenant/billing/viewCurrentBilling",
                    {
                        params: {
                            agreement_id,
                            user_id,
                        },
                    }
                );


                const bill = res.data.billing;
                console.log("billing current data: ", bill);

                if (!bill) {
                    setBillingData([]);
                    setMeterReadings([]);
                    return;
                }

                /* ---------------- BILLING DATA ---------------- */
                setBillingData([
                    {
                        billing_id: bill.billing_id,
                        billing_period: bill.billing_period ?? null,
                        due_date: bill.due_date ?? null,
                        status: bill.payment_status || bill.status || "unpaid",
                        unit_name: bill.unit_name,
                        total_amount_due: Number(bill.total_amount_due || 0),

                        showRent: true,
                        showUtility: true,

                        breakdown: res.data.breakdown || {},
                        propertyConfig: res.data.propertyConfig || {},
                        billingAdditionalCharges:
                            res.data.billingAdditionalCharges || [],
                        leaseAdditionalExpenses:
                            res.data.leaseAdditionalExpenses || [],
                        postDatedChecks: res.data.postDatedChecks || [],
                        utilities: res.data.utilities || {},
                    },
                ]);

                /* ---------------- METER READINGS ---------------- */
                const meters: any[] = [];

                if (res.data.utilities?.water?.enabled) {
                    meters.push({
                        type: "water",
                        ...res.data.utilities.water,
                    });
                }

                if (res.data.utilities?.electricity?.enabled) {
                    meters.push({
                        type: "electricity",
                        ...res.data.utilities.electricity,
                    });
                }

                setMeterReadings(meters);
                console.log('water billing meter data: ', res.data.utilities.water);

            } catch (e: any) {
                console.error("[TENANT BILLING HOOK] Error:", e);
                setError("Failed to fetch billing data.");
            } finally {
                setLoading(false);
            }
        };

        fetchBilling();
    }, [agreement_id, user_id]);

    return {
        billingData,
        setBillingData,
        meterReadings,
        loading,
        error,
    };
}
