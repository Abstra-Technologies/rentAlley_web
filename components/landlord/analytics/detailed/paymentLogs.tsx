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
    CalendarClock,
} from "lucide-react";

interface PaymentLog {
    payment_id: number;
    agreement_id: number;
    bill_id?: number;
    property_name?: string;
    unit_name?: string;
    tenant_name?: string;
    payment_type: string;
    amount_paid: number;
    payment_status: string;
    payment_date: string;
    receipt_reference?: string;
    created_at?: string;
    updated_at?: string;
    payment_method_id?: number;
    proof_of_payment?: string;
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

    /* ---------------- Fetch Properties ---------------- */
    useEffect(() => {
        if (!landlord_id) return;
        const fetchProperties = async () => {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}/properties`);
                const data = await res.json();
                setProperties(data.data || []);
            } catch (error) {
                console.error("❌ Error fetching properties:", error);
            }
        };
        fetchProperties();
    }, [landlord_id]);

    /* ---------------- Fetch Payment Logs ---------------- */
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
                console.error("❌ Error fetching payment logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, [landlord_id, selectedProperty, selectedMonth, search]);

    /* ---------------- Table Columns ---------------- */
    const columns = useMemo<MRT_ColumnDef<PaymentLog>[]>(() => [
        { accessorKey: "payment_id", header: "ID", size: 70 },
        { accessorKey: "property_name", header: "Property", size: 160 },
        { accessorKey: "unit_name", header: "Unit", size: 120 },
        { accessorKey: "tenant_name", header: "Tenant", size: 150 },
        {
            accessorKey: "payment_type",
            header: "Type",
            size: 110,
            Cell: ({ cell }) => (
                <span className="capitalize text-gray-700">{cell.getValue<string>()}</span>
            ),
        },
        {
            accessorKey: "amount_paid",
            header: "Amount",
            size: 140,
            Cell: ({ cell }) => (
                <span className="font-bold text-emerald-700">
                    {formatCurrency(cell.getValue<number>())}
                </span>
            ),
        },
        {
            accessorKey: "payment_status",
            header: "Status",
            size: 120,
            Cell: ({ cell }) => {
                const status = cell.getValue<string>();
                const color = {
                    confirmed: "bg-emerald-100 text-emerald-700",
                    pending: "bg-yellow-100 text-yellow-700",
                    failed: "bg-red-100 text-red-700",
                }[status] || "bg-gray-100 text-gray-600";

                return (
                    <span className={`px-2 py-1 text-xs rounded font-semibold ${color}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: "payment_date",
            header: "Date Paid",
            size: 140,
            Cell: ({ cell }) => formatDate(cell.getValue<string>()),
        },
    ], []);

    /* ---------------- PDF Download ---------------- */
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
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Payment_Logs_Report.pdf`;
            link.click();

            URL.revokeObjectURL(url);
        } catch (err) {
            alert("Failed to download report.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">

            {/* ---------------- Header ---------------- */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Payment Logs
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    View all tenant payments and transaction details.
                </p>
            </div>

            {/* ---------------- Split Layout (Responsive) ---------------- */}
            <div className="flex flex-col lg:flex-row gap-4 w-full">

                {/* ---------------- LEFT PANEL: TABLE ---------------- */}
                <div className="w-full lg:w-2/3 bg-white border border-gray-100 shadow-md rounded-2xl p-4">

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">

                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Property Filter */}
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-500 hidden sm:block" />
                                <select
                                    value={selectedProperty}
                                    onChange={(e) => setSelectedProperty(e.target.value)}
                                    className="border border-gray-300 rounded-lg text-sm px-3 py-2"
                                >
                                    <option value="all">All Properties</option>
                                    {properties.map((p) => (
                                        <option key={p.property_id} value={p.property_id}>
                                            {p.property_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Month Filter */}
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-gray-500 hidden sm:block" />
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="border border-gray-300 rounded-lg text-sm px-3 py-2"
                                />
                            </div>

                            {/* Search */}
                            <div className="flex items-center border border-gray-300 rounded-lg px-2 py-1 bg-gray-50">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search tenant..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadReport}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold shadow"
                        >
                            <Download className="w-4 h-4" />
                            Download Report
                        </button>
                    </div>

                    {/* Data Table */}
                    <MaterialReactTable
                        columns={columns}
                        data={data}
                        state={{ isLoading: loading }}
                        enableColumnFilters={false}
                        enablePagination
                        enableSorting
                        initialState={{ pagination: { pageSize: 10 } }}
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

                {/* ---------------- RIGHT PANEL: DETAILS ---------------- */}
                {selectedPayment && (
                    <div className="w-full lg:w-1/3 bg-white border border-gray-200 shadow-md rounded-2xl p-6 relative flex flex-col">

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedPayment(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-blue-600" /> Payment Details
                        </h2>

                        <div className="space-y-3 text-sm text-gray-700">

                            <p><span className="font-medium">Payment ID:</span> {selectedPayment.payment_id}</p>
                            <p><span className="font-medium">Bill ID:</span> {selectedPayment.bill_id || "—"}</p>

                            <p><span className="font-medium">Tenant:</span> {selectedPayment.tenant_name}</p>
                            <p><span className="font-medium">Property:</span> {selectedPayment.property_name}</p>
                            <p><span className="font-medium">Unit:</span> {selectedPayment.unit_name}</p>

                            <p className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{selectedPayment.payment_type}</span>
                            </p>

                            <p>
                                <span className="font-medium">Amount Paid:</span>{" "}
                                <span className="text-emerald-700 font-bold">
                                    {formatCurrency(selectedPayment.amount_paid)}
                                </span>
                            </p>

                            <p>
                                <span className="font-medium">Status:</span>{" "}
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100">
                                    {selectedPayment.payment_status}
                                </span>
                            </p>

                            <p>
                                <span className="font-medium">Payment Date:</span>{" "}
                                {formatDate(selectedPayment.payment_date)}
                            </p>

                            <p>
                                <span className="font-medium">Created:</span>{" "}
                                {selectedPayment.created_at ? formatDate(selectedPayment.created_at) : "—"}
                            </p>

                            <p>
                                <span className="font-medium">Updated:</span>{" "}
                                {selectedPayment.updated_at ? formatDate(selectedPayment.updated_at) : "—"}
                            </p>

                            {selectedPayment.proof_of_payment && (
                                <div className="mt-4">
                                    <span className="font-medium block mb-1">Proof of Payment:</span>
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
                )}
            </div>
        </div>
    );
}
