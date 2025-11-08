"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FileDown, Receipt, AlertCircle, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

interface Billing {
    billing_id: number;
    billing_period: string;
    total_amount_due: number;
    status: string;
    due_date: string;
    created_at?: string;
}

interface LeaseBillingProps {
    lease_id?: string;
    tenant_email?: string;
}

export default function LeaseBilling({ lease_id }: LeaseBillingProps) {
    const [billings, setBillings] = useState<Billing[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<number | null>(null);

    console.log('lease id:', lease_id);

    useEffect(() => {
        if (!lease_id) return;

        const fetchBillings = async () => {
            try {
                setLoading(true);

                const res = await axios.get(`/api/tenant/billing/previousBilling`, {
                    params: { agreement_id: lease_id },
                });

                setBillings(res.data.billings || []);
            } catch (err: any) {
                console.error("❌ Error fetching billing statements:", err);
                Swal.fire("Error", "Failed to fetch billing statements.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchBillings();
    }, [lease_id]);


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
    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 text-gray-600">
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Loading billing statements...
            </div>
        );
    }

    if (billings.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No Billing Statements Found
                </h3>
                <p className="text-sm text-gray-600">
                    Once a billing cycle is generated, it will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Billing Period
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">
                            Action
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                    {billings.map((bill) => (
                        <tr
                            key={bill.billing_id}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {bill.billing_period}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                ₱{Number(bill.total_amount_due).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {new Date(bill.due_date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bill.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : bill.status === "unpaid"
                                  ? "bg-amber-100 text-amber-700"
                                  : bill.status === "overdue"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {bill.status.charAt(0).toUpperCase() +
                        bill.status.slice(1).toLowerCase()}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                    onClick={() => handleDownload(bill.billing_id)}
                                    disabled={downloading === bill.billing_id}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        downloading === bill.billing_id
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {downloading === bill.billing_id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <FileDown className="w-4 h-4" />
                                            Download
                                        </>
                                    )}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="block md:hidden divide-y divide-gray-100">
                {billings.map((bill) => (
                    <div
                        key={bill.billing_id}
                        className="p-4 flex flex-col sm:flex-row justify-between sm:items-center"
                    >
                        <div>
                            <p className="text-gray-900 font-medium text-base mb-1">
                                {bill.billing_period}
                            </p>
                            <p className="text-gray-600 text-sm mb-1">
                                Due:{" "}
                                {new Date(bill.due_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                            <p className="text-gray-800 font-semibold">
                                ₱{Number(bill.total_amount_due).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                            </p>
                            <span
                                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    bill.status === "paid"
                                        ? "bg-green-100 text-green-700"
                                        : bill.status === "unpaid"
                                            ? "bg-amber-100 text-amber-700"
                                            : bill.status === "overdue"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-700"
                                }`}
                            >
                {bill.status.charAt(0).toUpperCase() +
                    bill.status.slice(1).toLowerCase()}
              </span>
                        </div>
                        <button
                            onClick={() => handleDownload(bill.billing_id)}
                            disabled={downloading === bill.billing_id}
                            className={`mt-3 sm:mt-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                downloading === bill.billing_id
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                        >
                            {downloading === bill.billing_id ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    Download
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
