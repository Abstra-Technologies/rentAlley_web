"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import Pagination from "@/components/Commons/Pagination";
import { FileText, CheckCircle, XCircle, RefreshCcw } from "lucide-react";

interface PDC {
    pdc_id: number;
    lease_id: number;
    check_number: string;
    bank_name: string;
    amount: number;
    due_date: string;
    status: "pending" | "cleared" | "bounced" | "replaced";
    uploaded_image_url?: string;
    notes?: string;
    tenant_name?: string;
    unit_name?: string;
}

interface Props {
    propertyId: number;
}

export default function PDCManagementPerProperty({ propertyId }: Props) {
    const [pdcList, setPdcList] = useState<PDC[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    });

    // ✅ Fetch ALL PDCs for the property
    const fetchPDCs = async () => {
        if (!propertyId) return;
        setLoading(true);
        try {
            const response = await axios.get("/api/landlord/pdc/getByProperty", {
                params: { property_id: propertyId, status: filterStatus !== "all" ? filterStatus : undefined },
            });
            const { data } = response.data;
            setPdcList(data || []);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to load PDC records.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPDCs();
    }, [propertyId, filterStatus]);

    const handleStatusUpdate = async (pdcId: number, newStatus: string) => {
        try {
            await axios.put("/api/landlord/pdc/updateStatus", {
                pdc_id: pdcId,
                status: newStatus,
            });
            Swal.fire("Updated", `PDC marked as ${newStatus}.`, "success");
            fetchPDCs();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to update PDC status.", "error");
        }
    };

    // ✅ Slice data locally for pagination
    const paginatedData = useMemo(() => {
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        return pdcList.slice(startIndex, endIndex);
    }, [pdcList, pagination]);

    const totalPages = Math.ceil(pdcList.length / pagination.limit);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-blue-50 to-emerald-50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Post-Dated Checks
                </h2>

                <div className="flex items-center gap-2">
                    {["all", "pending", "cleared", "bounced", "replaced"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                                filterStatus === status
                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Check #</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Bank</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Tenant</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Due Date</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={8} className="text-center py-6 text-gray-500">
                                Loading...
                            </td>
                        </tr>
                    ) : paginatedData.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center py-6 text-gray-500">
                                No PDC records found.
                            </td>
                        </tr>
                    ) : (
                        paginatedData.map((pdc) => (
                            <tr key={pdc.pdc_id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 font-medium text-gray-800">{pdc.check_number}</td>
                                <td className="px-4 py-3">{pdc.bank_name || "—"}</td>
                                <td className="px-4 py-3">{pdc.tenant_name || "—"}</td>
                                <td className="px-4 py-3">{pdc.unit_name || "—"}</td>
                                <td className="px-4 py-3 font-semibold text-blue-700">
                                    {formatCurrency(pdc.amount)}
                                </td>
                                <td className="px-4 py-3">{formatDate(pdc.due_date)}</td>
                                <td className="px-4 py-3 text-center">
                    <span
                        className={`px-2 py-1.5 text-xs rounded-full font-semibold ${
                            pdc.status === "cleared"
                                ? "bg-green-100 text-green-700"
                                : pdc.status === "bounced"
                                    ? "bg-red-100 text-red-700"
                                    : pdc.status === "replaced"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {pdc.status}
                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        {pdc.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(pdc.pdc_id, "cleared")}
                                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                                    title="Mark as Cleared"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(pdc.pdc_id, "bounced")}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                    title="Mark as Bounced"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {pdc.status === "bounced" && (
                                            <button
                                                onClick={() => handleStatusUpdate(pdc.pdc_id, "replaced")}
                                                className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                                                title="Mark as Replaced"
                                            >
                                                <RefreshCcw className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* ✅ Pagination (Frontend Controlled) */}
            {!loading && pdcList.length > pagination.limit && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={totalPages}
                    onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                    totalItems={pdcList.length}
                    itemsPerPage={pagination.limit}
                />
            )}
        </div>
    );
}
