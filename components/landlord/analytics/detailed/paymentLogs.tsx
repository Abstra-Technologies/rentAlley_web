"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";

interface PaymentLog {
    payment_id: number;
    agreement_id: number;
    payment_type: string;
    amount_paid: number;
    payment_status: string;
    payment_date: string;
    request_reference_number?: string;
}

export default function PaymentLogsPage({ landlord_id }: { landlord_id: number }) {
    const [data, setData] = useState<PaymentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!landlord_id) return;

        const fetchPayments = async () => {
            try {
                const res = await axios.get(`/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}`);
                setData(res.data || []);
            } catch (error) {
                console.error("Error fetching payment logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [landlord_id]);

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
                size: 80,
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

    return (
        <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Payment Logs
                </h1>
            </div>

            <MaterialReactTable
                columns={columns}
                data={data}
                state={{ isLoading: loading }}
                enableColumnFilters={true}
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
