"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDate, formatCurrency } from "@/utils/formatter/formatters";
import {
    DocumentArrowDownIcon,
    CalendarIcon,
    BanknotesIcon,
    FolderOpenIcon,
    ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

export default function PreviousBilling({ agreement_id, user_id }) {
    const [billingData, setBillingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [fetchFailed, setFetchFailed] = useState(false); // <-- NEW FLAG

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
                setFetchFailed(true); // <-- MARK AS FAILED, BUT DO NOT SHOW ERROR BOX
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
        setDownloadingId(billing_id);
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
        } finally {
            setDownloadingId(null);
        }
    };

    /* -----------------------------------------------
       LOADING STATE
    ------------------------------------------------*/
    if (loading)
        return (
            <div className="space-y-4 md:space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden"
                    >
                        <div className="p-4 md:p-5">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-7 h-7 bg-gray-200 rounded-lg animate-pulse" />
                                                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                                            </div>
                                            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                                <div className="h-11 w-full lg:w-48 bg-gray-200 rounded-xl animate-pulse" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-4 md:px-5 py-3 border-t border-gray-200">
                            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );

    /* -----------------------------------------------
       IF FETCH FAILED OR EMPTY → SHOW NO HISTORY
    ------------------------------------------------*/
    if (fetchFailed || billingData.length === 0)
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FolderOpenIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Billing History
                </h3>
                <p className="text-gray-600">
                    You currently have no previous billing records.
                </p>
            </div>
        );

    /* -----------------------------------------------
       BILLING LIST
    ------------------------------------------------*/
    return (
        <div className="space-y-4 md:space-y-3">
            {billingData.map((bill) => (
                <div
                    key={bill.billing_id}
                    className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
                >
                    <div className="p-4 md:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                            {/* Billing Info */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {/* Billing ID */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                            <ReceiptPercentIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            Billing ID
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">
                                        #{bill.billing_id}
                                    </p>
                                </div>

                                {/* Billing Period */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                                            <CalendarIcon className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            Period
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {formatDate(bill.billing_period)}
                                    </p>
                                </div>

                                {/* Total Amount */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-amber-100 rounded-lg">
                                            <BanknotesIcon className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            Amount
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(bill.total_amount_due || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={() => handleDownload(bill.billing_id)}
                                disabled={downloadingId === bill.billing_id}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed lg:w-auto text-sm sm:text-base"
                            >
                                {downloadingId === bill.billing_id ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <DocumentArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>Download PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer Bar */}
                    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-4 md:px-5 py-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">Statement available for download</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
