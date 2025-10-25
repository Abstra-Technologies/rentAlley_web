"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";
import { Download } from 'lucide-react';

interface PaymentLog {
    payment_id: number;
    agreement_id: number;
    property_name?: string;
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
    const router = useRouter();

    useEffect(() => {
        if (!landlord_id) return;

        const fetchProperties = async () => {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}/properties`);
                if (!res.ok) throw new Error("Failed to fetch properties");
                const data = await res.json();

                // Adjust to match your API structure
                setProperties(data.data || []);
            } catch (error) {
                console.error("❌ Error fetching properties:", error);
            }
        };

        fetchProperties();
    }, [landlord_id]);

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
    }, [landlord_id, selectedProperty, selectedMonth]);

    const columns = useMemo<MRT_ColumnDef<PaymentLog>[]>(
        () => [
            {
                accessorKey: "payment_id",
                header: "Payment ID",
                size: 80,
            },
            {
                accessorKey: "property_name",
                header: "Property",
                size: 150,
                Cell: ({ cell }) => <span className="text-gray-800">{cell.getValue<string>() || "—"}</span>,
            },
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
                size: 100,
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
                    const color =
                        status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700";
                    return (
                        <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${color}`}
                        >
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
            {
                accessorKey: "receipt_reference",
                header: "Reference No.",
                size: 150,
                Cell: ({ cell }) => (
                    <span className="text-gray-600 text-sm">
            {cell.getValue<string>() || "—"}
          </span>
                ),
            },
        ],
        []
    );
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
        <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-md border border-gray-100">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl sm:text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        Payment Logs
                    </h1>
                    <p className="text-sm text-gray-500">
                        View all tenant payments filtered by property and month.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                    {/* Property Selector */}
                    <select
                        value={selectedProperty}
                        onChange={(e) => setSelectedProperty(e.target.value)}
                        className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Properties</option>
                        {properties.map((p) => (
                            <option key={p.property_id} value={p.property_id}>
                                {p.property_name}
                            </option>
                        ))}
                    </select>

                    {/* Month Selector */}
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>
            <button
                onClick={handleDownloadReport}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all disabled:opacity-50"
            >
                <Download />
                ️ Download Report
            </button>

            {/* Payment Logs Table */}
            <MaterialReactTable
                columns={columns}
                data={data}
                state={{ isLoading: loading }}
                enableColumnFilters={false}
                enablePagination={true}
                enableSorting={true}
                initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
                muiTableBodyRowProps={{
                    onClick: (event, row) => {
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
    );
}
