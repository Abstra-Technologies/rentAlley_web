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
  X,
  Receipt,
  Filter,
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

export default function PaymentLogsPage({
  landlord_id,
}: {
  landlord_id: string;
}) {
  const [data, setData] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
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
            property_id:
              selectedProperty !== "all" ? selectedProperty : undefined,
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
  const columns = useMemo<MRT_ColumnDef<PaymentLog>[]>(
    () => [
      { accessorKey: "payment_id", header: "ID", size: 70 },
      { accessorKey: "property_name", header: "Property", size: 160 },
      { accessorKey: "unit_name", header: "Unit", size: 120 },
      { accessorKey: "tenant_name", header: "Tenant", size: 150 },
      {
        accessorKey: "payment_type",
        header: "Type",
        size: 110,
        Cell: ({ cell }) => (
          <span className="capitalize text-gray-700">
            {cell.getValue<string>()}
          </span>
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
          const color =
            {
              confirmed: "bg-emerald-100 text-emerald-700",
              pending: "bg-yellow-100 text-yellow-700",
              failed: "bg-red-100 text-red-700",
            }[status] || "bg-gray-100 text-gray-600";

          return (
            <span
              className={`px-2 py-1 text-xs rounded font-semibold ${color}`}
            >
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
    ],
    []
  );

  /* ---------------- PDF Download ---------------- */
  const handleDownloadReport = async () => {
    try {
      const res = await axios.get(`/api/landlord/reports/paymentList`, {
        params: {
          landlord_id,
          property_id:
            selectedProperty !== "all" ? selectedProperty : undefined,
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

  /* ---------------- Active Filter Count ---------------- */
  const activeFilterCount = [
    selectedProperty !== "all",
    selectedMonth !== "",
    search !== "",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen">
      {/* ---------------- Header ---------------- */}
      <div className="mb-3 sm:mb-4 md:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          Payment Logs
        </h1>
        <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 mt-1">
          View all tenant payments and transaction details.
        </p>
      </div>

      {/* ---------------- Split Layout (Responsive) ---------------- */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* ---------------- LEFT PANEL: TABLE ---------------- */}
        <div
          className={`w-full bg-white border border-gray-200 shadow-sm rounded-xl p-3 md:p-4 transition-all ${
            selectedPayment ? "lg:w-2/3" : "lg:w-full"
          }`}
        >
          {/* Mobile Filter Toggle + Download */}
          <div className="flex items-center justify-between gap-2 mb-3 md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium relative"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Report</span>
            </button>
          </div>

          {/* Desktop Filters */}
          <div
            className={`${
              showFilters ? "flex" : "hidden md:flex"
            } flex-col md:flex-row md:justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4 p-2.5 sm:p-3 md:p-0 bg-gray-50 md:bg-transparent rounded-lg md:rounded-none`}
          >
            <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:items-center">
              {/* Property Filter */}
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 sm:gap-2">
                <label className="text-[11px] sm:text-xs font-medium text-gray-700 md:hidden">
                  Property
                </label>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500 hidden md:block" />
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full md:w-auto border border-gray-300 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white"
                  >
                    <option value="all">All Properties</option>
                    {properties.map((p) => (
                      <option key={p.property_id} value={p.property_id}>
                        {p.property_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month Filter */}
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 sm:gap-2">
                <label className="text-[11px] sm:text-xs font-medium text-gray-700 md:hidden">
                  Month
                </label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500 hidden md:block" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full md:w-auto border border-gray-300 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white"
                  />
                </div>
              </div>

              {/* Search */}
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 sm:gap-2">
                <label className="text-[11px] sm:text-xs font-medium text-gray-700 md:hidden">
                  Search
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search tenant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-xs sm:text-sm w-full placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>
              </div>

              {/* Clear Filters - Mobile */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedProperty("all");
                    setSelectedMonth("");
                    setSearch("");
                  }}
                  className="md:hidden text-xs sm:text-sm text-blue-600 font-medium py-2"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Desktop Download Button */}
            <button
              onClick={handleDownloadReport}
              className="hidden md:flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-2.5 sm:space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-50 rounded-lg p-3 sm:p-4"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : data.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                  No Payments Found
                </p>
                <p className="text-[11px] sm:text-xs text-gray-600">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              data.map((payment) => (
                <div
                  key={payment.payment_id}
                  onClick={() => setSelectedPayment(payment)}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                        {payment.tenant_name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-600 truncate mt-0.5">
                        {payment.property_name} • {payment.unit_name}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 flex-shrink-0">
                      {formatCurrency(payment.amount_paid)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 mt-2">
                    <span>{formatDate(payment.payment_date)}</span>
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${
                        payment.payment_status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : payment.payment_status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
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
        </div>

        {/* ---------------- RIGHT PANEL: DETAILS (Slide-in on Mobile) ---------------- */}
        {selectedPayment && (
          <>
            {/* Mobile Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSelectedPayment(null)}
            />

            {/* Details Panel */}
            <div
              className={`
                            fixed md:static inset-x-0 bottom-0 md:inset-auto
                            w-full lg:w-1/3 
                            bg-white border-t md:border border-gray-200 
                            shadow-xl md:shadow-sm rounded-t-2xl md:rounded-2xl 
                            p-4 sm:p-6 z-50 md:z-auto
                            max-h-[85vh] md:max-h-none overflow-y-auto
                            animate-slide-up md:animate-none
                        `}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPayment(null)}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Drag Handle - Mobile Only */}
              <div className="md:hidden w-10 sm:w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3 sm:mb-4" />

              <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3 sm:mb-4">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span>Payment Details</span>
              </h2>

              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Payment ID:</span>
                  <span className="text-gray-600">
                    {selectedPayment.payment_id}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Bill ID:</span>
                  <span className="text-gray-600">
                    {selectedPayment.bill_id || "—"}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Tenant:</span>
                  <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">
                    {selectedPayment.tenant_name}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Property:</span>
                  <span className="text-gray-600 text-right max-w-[60%] truncate">
                    {selectedPayment.property_name}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Unit:</span>
                  <span className="text-gray-600">
                    {selectedPayment.unit_name}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium flex items-center gap-1.5 sm:gap-2">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                    Type:
                  </span>
                  <span className="text-gray-900 capitalize font-medium">
                    {selectedPayment.payment_type}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Amount Paid:</span>
                  <span className="text-emerald-700 font-bold text-sm sm:text-base">
                    {formatCurrency(selectedPayment.amount_paid)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${
                      selectedPayment.payment_status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : selectedPayment.payment_status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedPayment.payment_status}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Payment Date:</span>
                  <span className="text-gray-600 text-right">
                    {formatDate(selectedPayment.payment_date)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Created:</span>
                  <span className="text-gray-600 text-right">
                    {selectedPayment.created_at
                      ? formatDate(selectedPayment.created_at)
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-100">
                  <span className="font-medium">Updated:</span>
                  <span className="text-gray-600 text-right">
                    {selectedPayment.updated_at
                      ? formatDate(selectedPayment.updated_at)
                      : "—"}
                  </span>
                </div>

                {selectedPayment.proof_of_payment && (
                  <div className="pt-2 sm:pt-3">
                    <span className="font-medium block mb-1.5 sm:mb-2">
                      Proof of Payment:
                    </span>
                    <a
                      href={selectedPayment.proof_of_payment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      View uploaded file
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
