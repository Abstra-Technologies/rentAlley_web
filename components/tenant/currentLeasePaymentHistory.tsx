"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";
import { Paper } from "@mui/material";
import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

export default function TenantLeasePayments({ agreement_id }: { agreement_id: number }) {
  const [payments, setPayments] = useState([]);
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await axios.get(
            `/api/tenant/payment/currentPaymentHistory?agreement_id=${agreement_id}`
        );

        if (res.status === 200) {
          setLease(res.data.leaseAgreement || null);
          setPayments(res.data.payments || []);
        } else {
          setError(`Unexpected response: ${res.status}`);
        }
      } catch (err: any) {
        setError(
            `Failed to fetch payments. ${err.response?.data?.error || err.message}`
        );
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchPayments();
  }, [agreement_id]);

  // 💡 Table columns
  const columns = useMemo<MRT_ColumnDef<any>[]>(
      () => [
        {
          accessorKey: "payment_date",
          header: "Date",
          Cell: ({ cell }) => <span>{formatDate(cell.getValue<string>())}</span>,
        },
        {
          accessorKey: "payment_type",
          header: "Type",
          Cell: ({ cell }) => (
              <span className="uppercase text-gray-700">
            {cell.getValue<string>().replace("_", " ")}
          </span>
          ),
        },
        {
          accessorKey: "amount_paid",
          header: "Amount Paid",
          muiTableHeadCellProps: { align: "right" },
          muiTableBodyCellProps: { align: "right" },
          Cell: ({ cell }) => (
              <span className="font-semibold text-gray-900">
            {formatCurrency(Number(cell.getValue()))}
          </span>
          ),
        },
        {
          accessorKey: "payment_status",
          header: "Status",
          Cell: ({ cell }) => {
            const value = cell.getValue<string>().toLowerCase();
            const badgeColor =
                value === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : value === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700";
            return (
                <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badgeColor}`}
                >
              {value.toUpperCase()}
            </span>
            );
          },
        },
      ],
          []
  );

  // ⚠️ No payments
    if (payments.length === 0) {
        return (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-md">
                <div className="flex items-center">
                    <svg
                        className="h-6 w-6 text-blue-500 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div>
                        <p className="text-blue-700 font-medium">
                            No payment records found for the active lease.
                        </p>

                    </div>
                </div>
            </div>
        );
    }

    // 🌀 Loading screen
    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
                <LoadingScreen message="Fetching your lease payments, please wait..." />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorBoundary
                error={
                    error ||
                    "Failed to load data. Please check your internet connection or try again."
                }
                onRetry={() => window.location.reload()}
            />
        );
    }

    // ⚠️ No lease
    if (!lease) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-md">
                <div className="flex items-center">
                    <svg
                        className="h-6 w-6 text-yellow-500 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="text-yellow-700 font-medium">
                        No active lease found for this tenant.
                    </p>
                </div>
            </div>
        );
    }

  return (
      <div className="bg-white shadow-md rounded-2xl border border-gray-200 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 px-6 pt-6 pb-3 border-b">
          Payment History
        </h2>

        {/* 🖥️ Desktop: MaterialReactTable */}
        <div className="hidden md:block">
          <Paper
              elevation={0}
              sx={{
                borderRadius: "0 0 1rem 1rem",
                "& .MuiTableContainer-root": { borderRadius: 0 },
              }}
          >
            <MaterialReactTable
                columns={columns}
                data={payments}
                enableColumnActions={false}
                enableColumnFilters={false}
                enableSorting
                enablePagination
                enableBottomToolbar={true}
                enableTopToolbar={false}
                state={{ pagination }}
                onPaginationChange={setPagination}
                muiPaginationProps={{
                  rowsPerPageOptions: [10, 20, 30, 40, 50],
                  labelRowsPerPage: "Rows per page:",
                }}
                muiTableBodyRowProps={{
                  sx: { "&:hover": { backgroundColor: "#f9fafb" } },
                }}
            />
          </Paper>
        </div>

        {/* 📱 Mobile: Card list */}
        <div className="md:hidden divide-y divide-gray-100">
          {payments.map((p) => (
              <div
                  key={p.payment_id}
                  className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition-all duration-200"
              >
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(p.payment_date)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="font-medium">Type:</span>
                  <span>{p.payment_type.replace("_", " ").toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="font-medium">Amount:</span>
                  <span className="text-gray-900 font-semibold">
                {formatCurrency(p.amount_paid)}
              </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Status:</span>
                  <span
                      className={`font-semibold ${
                          p.payment_status === "confirmed"
                              ? "text-green-600"
                              : p.payment_status === "pending"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                      }`}
                  >
                {p.payment_status.toUpperCase()}
              </span>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}
