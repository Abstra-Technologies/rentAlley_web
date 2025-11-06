"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";
import { Download, CalendarDays, Building2, Search, TrendingUp, Wallet, AlertTriangle } from "lucide-react";

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
    const [summary, setSummary] = useState({
        totalCollected: 0,
        pending: 0,
        overdue: 0,
    });
    const router = useRouter();

    // ✅ Fetch Properties
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

    // ✅ Fetch Payment Logs + Summary
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
                const payments = res.data || [];
                setData(payments);

                // 🔹 Generate Summary
                const totalCollected = payments
                    .filter((p: PaymentLog) => p.payment_status === "confirmed")
                    .reduce((sum: number, p: PaymentLog) => sum + Number(p.amount_paid), 0);

                const pending = payments.filter((p: PaymentLog) => p.payment_status === "pending").length;
                const overdue = payments.filter((p: PaymentLog) => p.payment_status === "overdue").length;

                setSummary({ totalCollected, pending, overdue });
            } catch (error) {
                console.error("Error fetching payment logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [landlord_id, selectedProperty, selectedMonth, search]);

    // ✅ Columns for Table
    const columns = useMemo<MRT_ColumnDef<PaymentLog>[]>(
        () => [
            { accessorKey: "payment_id", header: "ID", size: 80 },
            {
                accessorKey: "property_name",
                header: "Property",
                size: 150,
            },
            {
                accessorKey: "unit_name",
                header: "Unit",
                size: 120,
            },
            {
                accessorKey: "tenant_name",
                header: "Tenant",
                size: 150,
            },
            {
                accessorKey: "payment_type",
                header: "Type",
                size: 100,
                Cell: ({ cell }) => <span className="capitalize text-gray-700">{cell.getValue<string>()}</span>,
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
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${colorMap[status] || "bg-gray-100 text-gray-600"}`}>
              {status}
            </span>
                    );
                },
            },
            {
                accessorKey: "payment_date",
                header: "Date Paid",
                size: 120,
                Cell: ({ cell }) => <span>{formatDate(cell.getValue<string>())}</span>,
            },
        ],
        []
    );

    // ✅ PDF Download
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
                    : properties.find((p) => p.property_id === selectedProperty)?.property_name?.replace(/\s+/g, "_") || "Property";
            link.href = url;
            link.download = `Payment_Report_${propertyLabel}_${monthLabel}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading report:", error);
            alert("Failed to download report. Please try again.");
        }
    };

    // ✅ UI Layout
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-6 px-4 sm:px-6">
            {/* ====== Summary Section ====== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-emerald-700 font-medium">Total Collected</p>
                        <p className="text-xl font-bold text-emerald-900">{formatCurrency(summary.totalCollected)}</p>
                    </div>
                    <Wallet className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-yellow-700 font-medium">Pending</p>
                        <p className="text-xl font-bold text-yellow-900">{summary.pending}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-red-700 font-medium">Overdue</p>
                        <p className="text-xl font-bold text-red-900">{summary.overdue}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
            </div>

            {/* ===== Header and Filters ===== */}
            <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-4 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                            Payment Logs
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Track, filter, and export all tenant payments.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 hidden sm:block" />
                            <select
                                value={selectedProperty}
                                onChange={(e) => setSelectedProperty(e.target.value)}
                                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Properties</option>
                                {properties.map((p) => (
                                    <option key={p.property_id} value={p.property_id}>
                                        {p.property_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-gray-400 hidden sm:block" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="flex items-center border border-gray-300 rounded-lg px-2 py-1 bg-gray-50">
                            <Search className="w-4 h-4 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search tenant..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="outline-none bg-transparent text-sm w-36 sm:w-48"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleDownloadReport}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 shadow transition-all disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </button>
                </div>
            </div>

            {/* ===== Table Section ===== */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3 sm:p-6">
                <MaterialReactTable
                    columns={columns}
                    data={data}
                    state={{ isLoading: loading }}
                    enableColumnFilters={false}
                    enablePagination
                    enableSorting
                    initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
                    muiTableBodyRowProps={{
                        onClick: (_event, row) => {
                            const payment = row.original;
                            router.push(`/pages/landlord/payment/details/${payment.payment_id}`);
                        },
                        sx: { cursor: "pointer" },
                    }}
                    muiTablePaperProps={{
                        elevation: 0,
                        sx: { borderRadius: "12px", border: "1px solid #E5E7EB" },
                    }}
                />
            </div>
        </div>
    );
}
