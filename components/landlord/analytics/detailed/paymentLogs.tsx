"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";
import {
    Download,
    CalendarDays,
    Building2,
    Search,
    FileText,
    CreditCard,
    User,
    CalendarClock,
} from "lucide-react";

interface PaymentLog {
    payment_id: number;
    agreement_id: number;
    property_name?: string;
    unit_name?: string;
    tenant_name?: string;
    payment_type: string;
    amount_paid: number;
    payment_status: string;
    payment_date: string;
    receipt_reference?: string;
}

interface Property {
    property_id: string;
    property_name: string;
}

export default function PaymentLogsPage({ landlord_id }: { landlord_id: string }) {
    const [data, setData] = useState<PaymentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(null);
    const router = useRouter();

    // Fetch Properties
    useEffect(() => {
        if (!landlord_id) return;
        const fetchProperties = async () => {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}/properties`);
                if (!res.ok) throw new Error("Failed to fetch properties");
                const data = await res.json();
                setProperties(data.data || []);
            } catch (error) {
                console.error("❌ Error fetching properties:", error);
            }
        };
        fetchProperties();
    }, [landlord_id]);

    // Fetch Payment Logs
    useEffect(() => {
        if (!landlord_id) return;
        const fetchPayments = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/landlord/payments/getPaymentList`, {
                    params: {
                        landlord_id,
                        property_id: selectedProperty !== "all" ? selectedProperty : undefined,
                        month: selectedMonth || undefined,
                        search: search || undefined,
                    },
                });
                setData(res.data || []);
            } catch (error) {
                console.error("Error fetching payment logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, [landlord_id, selectedProperty, selectedMonth, search]);

    // Table Columns
    const columns = useMemo<MRT_ColumnDef<PaymentLog>[]>(
        () => [
            { accessorKey: "payment_id", header: "ID", size: 70 },
            { accessorKey: "property_name", header: "Property", size: 150 },
            { accessorKey: "unit_name", header: "Unit", size: 120 },
            { accessorKey: "tenant_name", header: "Tenant", size: 150 },
            {
                accessorKey: "payment_type",
                header: "Type",
                size: 100,
                Cell: ({ cell }) => (
                    <span className="capitalize text-gray-700">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: "amount_paid",
                header: "Amount",
                size: 120,
                Cell: ({ cell }) => (
                    <span className="font-semibold text-emerald-700">
            {formatCurrency(cell.getValue<number>())}
          </span>
                ),
            },
            {
                accessorKey: "payment_status",
                header: "Status",
                size: 100,
                Cell: ({ cell }) => {
                    const status = cell.getValue<string>();
                    const colorMap: Record<string, string> = {
                        confirmed: "bg-emerald-100 text-emerald-700",
                        pending: "bg-yellow-100 text-yellow-700",
                        overdue: "bg-red-100 text-red-700",
                    };
                    return (
                        <span
                            className={`text-xs font-semibold px-2 py-1 rounded-md ${
                                colorMap[status] || "bg-gray-100 text-gray-600"
                            }`}
                        >
              {status}
            </span>
                    );
                },
            },
            {
                accessorKey: "payment_date",
                header: "Date Paid",
                size: 130,
                Cell: ({ cell }) => <span>{formatDate(cell.getValue<string>())}</span>,
            },
        ],
        []
    );

    // Download PDF
    const handleDownloadReport = async () => {
        try {
            const res = await axios.get(`/api/landlord/reports/paymentList`, {
                params: {
                    landlord_id,
                    property_id: selectedProperty !== "all" ? selectedProperty : undefined,
                    month: selectedMonth || undefined,
                },
                responseType: "blob",
            });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const monthLabel = selectedMonth ? selectedMonth.replace("-", "_") : "all";
            const propertyLabel =
                selectedProperty === "all"
                    ? "All_Properties"
                    : properties.find((p) => p.property_id === selectedProperty)?.property_name?.replace(/\s+/g, "_") ||
                    "Property";
            link.href = url;
            link.download = `Payment_Report_${propertyLabel}_${monthLabel}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading report:", error);
            alert("Failed to download report. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-6 px-4 sm:px-6">
            {/* ===== Header ===== */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Payment Logs
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    View all tenant payments and transaction details.
                </p>
            </div>

            {/* ===== Split Layout ===== */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* ===== Left: Table + Filters ===== */}
                <div className="flex-1 bg-white border border-gray-100 shadow-md rounded-2xl p-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Building2 className="w-4 h-4 text-gray-400 hidden sm:block" />
                                <select
                                    value={selectedProperty}
                                    onChange={(e) => setSelectedProperty(e.target.value)}
                                    className="border border-gray-300 rounded-lg text-sm px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Properties</option>
                                    {properties.map((p) => (
                                        <option key={p.property_id} value={p.property_id}>
                                            {p.property_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <CalendarDays className="w-4 h-4 text-gray-400 hidden sm:block" />
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="border border-gray-300 rounded-lg text-sm px-3 py-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex items-center border border-gray-300 rounded-lg px-2 py-1 bg-gray-50 w-full sm:w-auto">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search tenant..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="outline-none bg-transparent text-sm w-full sm:w-48"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadReport}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 shadow transition-all disabled:opacity-50 w-full sm:w-auto"
                        >
                            <Download className="w-4 h-4" />
                            Download Report
                        </button>
                    </div>

                    {/* Table */}
                    <MaterialReactTable
                        columns={columns}
                        data={data}
                        state={{ isLoading: loading }}
                        enableColumnFilters={false}
                        enablePagination
                        enableSorting
                        initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
                        muiTableBodyRowProps={({ row }) => ({
                            onClick: () => setSelectedPayment(row.original),
                            sx: { cursor: "pointer" },
                        })}

                        muiTablePaperProps={{
                            elevation: 0,
                            sx: { borderRadius: "12px", border: "1px solid #E5E7EB" },
                        }}
                    />
                </div>

                {/* ===== Right: Details Panel ===== */}
                {selectedPayment && (
                    <div className="lg:w-1/3 bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                            {/* Header */}
                            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Payment Details
                            </h2>

                            {/* Details */}
                            <div className="space-y-3 text-sm text-gray-700">
                                {/* Basic IDs */}
                                <p>
                                    <span className="font-medium text-gray-500">Payment ID:</span>{" "}
                                    {selectedPayment.payment_id}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Bill ID:</span>{" "}
                                    {selectedPayment.bill_id || "—"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Agreement ID:</span>{" "}
                                    {selectedPayment.agreement_id || "—"}
                                </p>

                                {/* Linked Info */}
                                <p>
                                    <span className="font-medium text-gray-500">Tenant:</span>{" "}
                                    {selectedPayment.tenant_name || "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Property:</span>{" "}
                                    {selectedPayment.property_name || "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Unit:</span>{" "}
                                    {selectedPayment.unit_name || "N/A"}
                                </p>

                                {/* Payment Type and Method */}
                                <p className="flex items-center gap-1">
                                    <CreditCard className="w-4 h-4 text-gray-500" />{" "}
                                    {selectedPayment.payment_type === "billing"
                                        ? "Billing Payment"
                                        : "Initial Payment"}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Payment Method ID:</span>{" "}
                                    {selectedPayment.payment_method_id || "—"}
                                </p>

                                {/* Amount and Status */}
                                <p>
                                    <span className="font-medium text-gray-500">Amount Paid:</span>{" "}
                                    <span className="text-emerald-700 font-semibold">
            {formatCurrency(selectedPayment.amount_paid)}
          </span>
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Status:</span>{" "}
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                            selectedPayment.payment_status === "confirmed"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : selectedPayment.payment_status === "pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : selectedPayment.payment_status === "failed"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
            {selectedPayment.payment_status}
          </span>
                                </p>

                                {/* References */}
                                <p>
                                    <span className="font-medium text-gray-500">Receipt Reference:</span>{" "}
                                    {selectedPayment.receipt_reference || "—"}
                                </p>

                                {/* Dates */}
                                <p className="flex items-center gap-1">
                                    <CalendarClock className="w-4 h-4 text-gray-500" />{" "}
                                    <span className="font-medium text-gray-500">Payment Date:</span>{" "}
                                    {formatDate(selectedPayment.payment_date)}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Created At:</span>{" "}
                                    {formatDate(selectedPayment.created_at)}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-500">Last Updated:</span>{" "}
                                    {formatDate(selectedPayment.updated_at)}
                                </p>

                                {/* Proof of Payment */}
                                {selectedPayment.proof_of_payment && (
                                    <div className="mt-3">
            <span className="font-medium text-gray-500 block mb-1">
              Proof of Payment:
            </span>
                                        <a
                                            href={selectedPayment.proof_of_payment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            View uploaded file
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Action */}

                    </div>
                )}

            </div>
        </div>
    );
}
