"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export function useTenantBilling(agreement_id, user_id) {
    const [billingData, setBillingData] = useState([]);
    const [meterReadings, setMeterReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user_id) return;

        const fetchBilling = async () => {
            try {
                const res = await axios.get("/api/tenant/billing/viewCurrentBilling", {
                    params: { agreement_id, user_id },
                });

                const bill = res.data.billing || {};
                bill.showRent = true;
                bill.showUtility = true;

                setBillingData([
                    {
                        ...bill,
                        breakdown: res.data.breakdown || {},
                        propertyConfig: res.data.propertyConfig || {},
                        billingAdditionalCharges: res.data.billingAdditionalCharges || [],
                        leaseAdditionalExpenses: res.data.leaseAdditionalExpenses || [],
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
