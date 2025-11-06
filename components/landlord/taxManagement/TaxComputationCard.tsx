"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FileText, Calculator } from "lucide-react";
import { formatCurrency } from "@/utils/formatter/formatters";

interface Props {
    landlordId: string;
    taxType: string;
    filingType: string;
}

export default function TaxComputationCard({ landlordId, taxType, filingType }: Props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!landlordId || !taxType) return;
        fetchComputation();
    }, [landlordId, taxType, filingType]);

    const fetchComputation = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `/api/landlord/taxProfile/compute?landlord_id=${landlordId}&tax_type=${taxType}&filing_type=${filingType}`
            );
            setData(res.data);
        } catch (error) {
            console.error("Failed to compute tax:", error);
            Swal.fire("Error", "Failed to compute tax data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadForm = async () => {
        try {
            Swal.fire({
                title: "Generating BIR Form...",
                text: "Please wait a moment.",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.get(
                `/api/landlord/taxForm?landlord_id=${landlordId}&type=${taxType}`,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `BIR_Form_${taxType.toUpperCase()}_${data?.period}.pdf`;
            a.click();
            Swal.close();
        } catch (err) {
            Swal.fire("Error", "Failed to generate BIR form", "error");
        }
    };

    return (
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-emerald-50 p-5 rounded-xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Calculator className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Tax Computation Summary</h2>
                    <p className="text-sm text-gray-500">
                        Computed automatically based on your billing and payment records
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4 text-gray-500">Calculating tax data...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Period Info */}
                    <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm col-span-2">
                        <p className="text-sm text-gray-500">
                            Filing Period ({data?.filing_type?.toUpperCase()})
                        </p>
                        <p className="text-xl font-bold text-blue-700">
                            {data?.period} • {data?.tax_type?.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Covered Period: {data?.start_period} — {data?.end_period}
                        </p>
                    </div>

                    {/* Gross Income */}
                    <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500">Gross Receipts</p>
                        <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(data?.gross_income || 0)}
                        </p>
                    </div>

                    {/* Output VAT or Tax */}
                    <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500">
                            {taxType === "vat"
                                ? "Output VAT (12%)"
                                : taxType === "percentage"
                                    ? "Percentage Tax (3%)"
                                    : "Non-VAT (0%)"}
                        </p>
                        <p className="text-2xl font-bold text-emerald-700">
                            {formatCurrency(data?.tax_due || 0)}
                        </p>
                    </div>

                    {/* Computation Breakdown */}
                    <div className="col-span-2 mt-4">
                        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                            <h3 className="text-md font-semibold text-gray-800 mb-3">
                                Computation Breakdown
                            </h3>

                            <table className="w-full text-sm text-gray-700">
                                <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-2">Gross Receipts</td>
                                    <td className="text-right font-medium">
                                        {formatCurrency(data?.gross_income || 0)}
                                    </td>
                                </tr>

                                {taxType === "vat" && (
                                    <>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2">Output VAT (12%)</td>
                                            <td className="text-right font-medium">
                                                {formatCurrency(data?.tax_due || 0)}
                                            </td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2">Creditable VAT Withheld</td>
                                            <td className="text-right font-medium text-gray-500">
                                                {formatCurrency(0)} {/* Placeholder for future withholding data */}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 font-semibold">Net VAT Payable</td>
                                            <td className="text-right font-semibold text-emerald-700">
                                                {formatCurrency(data?.tax_due || 0)}
                                            </td>
                                        </tr>
                                    </>
                                )}

                                {taxType === "percentage" && (
                                    <tr>
                                        <td className="py-2 font-semibold">Tax Payable (3%)</td>
                                        <td className="text-right font-semibold text-emerald-700">
                                            {formatCurrency(data?.tax_due || 0)}
                                        </td>
                                    </tr>
                                )}

                                {taxType === "non-vat" && (
                                    <tr>
                                        <td className="py-2 text-gray-500 italic">Non-VAT registered – No tax due</td>
                                        <td className="text-right text-gray-500">₱0.00</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recommended Form */}
                    <div className="sm:col-span-2 mt-2 text-sm text-gray-600">
                        Filing Type:{" "}
                        <span className="font-semibold text-gray-800 capitalize">
                            {data?.filing_type}
                        </span>{" "}
                        • Recommended Form:{" "}
                        <span className="font-semibold text-blue-700">
                            {taxType === "vat"
                                ? filingType === "quarterly"
                                    ? "BIR Form 2550Q (Quarterly VAT)"
                                    : "BIR Form 2550M (Monthly VAT)"
                                : taxType === "percentage"
                                    ? "BIR Form 2551Q (Quarterly Percentage Tax)"
                                    : "N/A (Non-VAT)"}{" "}
                        </span>
                    </div>

                    {/* Download Form */}
                    {taxType !== "non-vat" && (
                        <div className="sm:col-span-2 mt-4 flex justify-end">
                            <button
                                onClick={handleDownloadForm}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 shadow-md transition"
                            >
                                <FileText className="w-4 h-4" />
                                Generate Pre-Filled Form
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
