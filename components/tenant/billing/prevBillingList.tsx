"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDate, formatCurrency } from "@/utils/formatter/formatters";

export default function PreviousBilling({ agreement_id, user_id }) {
    const [billingData, setBillingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user_id) return;

        const fetchBillingData = async () => {
            try {
                const res = await axios.get("/api/tenant/billing/previousBilling", {
                    params: { agreement_id, user_id },
                });
                setBillingData(res.data.billings || []);
            } catch (err) {
                console.error("Error fetching previous billing:", err);
                setError("Failed to fetch previous billing.");
            } finally {
                setLoading(false);
            }
        };

        fetchBillingData();
    }, [agreement_id, user_id]);

    /**
     * Generate & download PDF on demand.
     */
    const handleDownload = async (billing_id: string) => {
        try {
            const res = await axios.get(`/api/tenant/billing/${billing_id}`, {
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Billing_${billing_id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate billing PDF.");
        }
    };

    if (loading)
        return (
            <div className="flex items-center justify-center py-10 text-gray-600">
                Loading previous billing records...
            </div>
        );

    if (error)
        return (
            <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                {error}
            </div>
        );

    if (!billingData.length)
        return (
            <div className="text-gray-500 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                No previous billing records found.
            </div>
        );

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Previous Billings</h1>

            {/* Billing List */}
            <div className="space-y-3">
                {billingData.map((bill) => (
                    <div
                        key={bill.billing_id}
                        className="flex justify-between items-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
                            {/* Billing ID */}
                            <div>
                                <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                                    Billing ID
                                </p>
                                <p className="text-sm font-bold text-gray-800">
                                    {bill.billing_id}
                                </p>
                            </div>

                            {/* Billing Period */}
                            <div>
                                <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                                    Billing Period
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                    {formatDate(bill.billing_period)}
                                </p>
                            </div>

                            {/* Total Amount */}
                            <div>
                                <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                                    Total Amount
                                </p>
                                <p className="text-sm font-semibold text-emerald-700">
                                    {formatCurrency(bill.total_amount_due || 0)}
                                </p>
                            </div>
                        </div>

                        {/* View / Download Button */}
                        <button
                            onClick={() => handleDownload(bill.billing_id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all"
                        >
                            View PDF
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
