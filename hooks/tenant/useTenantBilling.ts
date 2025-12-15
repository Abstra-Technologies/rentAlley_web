"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export function useTenantBilling(agreement_id, user_id) {
    const [billingData, setBillingData] = useState([]);
    const [meterReadings, setMeterReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log('HOOK AGREEMENT ID: ', agreement_id);
    console.log('HOOK USER ID: ', user_id);

    useEffect(() => {
        if (!user_id) {
            setLoading(false);
            setBillingData([]);
            return;
        }

        const fetchBilling = async () => {
            try {
                setLoading(true);

                const res = await axios.get(
                    "/api/tenant/billing/viewCurrentBilling",
                    { params: { agreement_id, user_id } }
                );

                const bill = res.data.billing;

                if (!bill) {
                    setBillingData([]);
                    return;
                }

                setBillingData([
                    {
                        billing_id: bill.billing_id,
                        billing_period: bill.billing_period ?? null,
                        due_date: bill.due_date ?? null,
                        status: bill.status,
                        unit_name: bill.unit_name,
                        total_amount_due: bill.total_amount_due,

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

                setMeterReadings([
                    ...(res.data.meterReadings?.water || []),
                    ...(res.data.meterReadings?.electricity || []),
                ]);
            } catch (e) {
                setError("Failed to fetch billing data.");
            } finally {
                setLoading(false);
            }
        };

        fetchBilling();
    }, [agreement_id, user_id]);

    return { billingData, setBillingData, meterReadings, loading, error };
}
