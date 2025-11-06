"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import axios from "axios";
import { Box, Typography } from "@mui/material";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";

interface Payment {
    payment_id: number;
    amount_paid: number;
    payment_status: string;
    payment_method_name?: string;
    payment_date: string;
    receipt_reference?: string;
    proof_of_payment?: string;
    payment_type?: string;
}

export default function LeasePayments({ lease }: { lease: any }) {
    const [data, setData] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!lease?.lease_id) return;

        const fetchPayments = async () => {
            try {
                const res = await axios.get(
                    `/api/tenant/activeRent/paymentsList?agreement_id=${lease.lease_id}`
                );
                setData(res.data || []);
            } catch (err) {
                console.error("Error fetching lease payments:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [lease?.lease_id]);

    const columns = useMemo<MRT_ColumnDef<Payment>[]>(
        () => [
            {
                accessorKey: "payment_date",
                header: "Date",
                size: 130,
                Cell: ({ cell }) => <span>{formatDate(cell.getValue<string>())}</span>,
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
                accessorKey: "payment_type",
                header: "Type",
                size: 120,
                Cell: ({ cell }) => (
                    <span className="text-gray-700">
            {cell.getValue<string>() || "—"}
            </span>)

            },
    {
        accessorKey: "payment_method_name",
            header: "Method",
        size: 120,
        Cell: ({ cell }) => (
        <span className="text-gray-700">
            {cell.getValue<string>() || "—"}
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
        accessorKey: "receipt_reference",
            header: "Reference No.",
        size: 160,
        Cell: ({ cell }) => (
        <span className="text-gray-600 text-sm">
            {cell.getValue<string>() || "—"}
            </span>
    ),
    },
    {
        accessorKey: "proof_of_payment",
            header: "Proof",
        size: 80,
        Cell: ({ cell }) => {
        const link = cell.getValue<string>();
        return link ? (
                <a
                    href={link}
            target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-sm"
            >
            View
            </a>
    ) : (
            <span className="text-gray-400 italic">N/A</span>
        );
    },
    },
],
    []
);

    return (
        <Box className="p-4 border rounded-lg shadow-sm bg-white mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <Typography
            variant="h6"
    className="font-semibold text-gray-800 mb-2 sm:mb-0"
        >
        Payment Records
    </Typography>

    <Typography variant="body2" className="text-gray-500">
        Lease ID: #{lease.lease_id}
    </Typography>
    </div>

    <MaterialReactTable
    columns={columns}
    data={data}
    state={{ isLoading: loading }}
    enableSorting
    enableColumnFilters
    enablePagination
    initialState={{
        pagination: { pageSize: 10, pageIndex: 0 },
        density: "compact",
    }}
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
    muiTableHeadCellProps={{
        sx: { backgroundColor: "#F9FAFB", fontWeight: "600" },
    }}
    muiToolbarAlertBannerProps={{
        color: "info",
            children: "Click any row to view payment details.",
    }}
    />
    </Box>
);
}
