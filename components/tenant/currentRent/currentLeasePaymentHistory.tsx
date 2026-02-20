"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

interface Payment {
  payment_id: number;
  bill_id?: number;
  payment_date: string;
  payment_type: string;
  amount_paid: number;
  payment_status: "confirmed" | "pending" | "failed";
}

interface Lease {
  agreement_id: string;
  property_name: string;
  unit_name: string;
  start_date: string;
  end_date: string;
}

export default function TenantLeasePayments({
  agreement_id,
}: {
  agreement_id: string;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  /* ================= FETCH ================= */
  const fetchPayments = async () => {
    try {
      setIsRefetching(true);

      const res = await axios.get(`/api/tenant/payment/currentPaymentHistory`, {
        params: { agreement_id },
      });

      if (res.status === 200) {
        const leaseData = res.data?.leaseAgreement;
        setLease(leaseData && leaseData.agreement_id ? leaseData : null);
        setPayments(res.data?.payments || []);
        setError(null);
      } else {
        setError(`Unexpected response: ${res.status}`);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setLease(null);
        setPayments([]);
        setError(null);
      } else {
        setError(
          `Failed to fetch payments. ${
            err.response?.data?.error || err.message
          }`
        );
      }
    } finally {
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPayments().finally(() => setLoading(false));
  }, [agreement_id]);

  /* ================= UI HELPERS ================= */
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <CheckCircleIcon className="w-5 h-5 text-emerald-600" />;
      case "pending":
        return <ClockIcon className="w-5 h-5 text-amber-600" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="h-full px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
          <div className="mb-6 md:mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="h-7 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* ================= HEADER ================= */}
      <div className="h-full px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        <div className="mb-6 md:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex-shrink-0">
                <ReceiptPercentIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Payment History
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Complete record of your lease payments
                </p>
              </div>
            </div>

            <button
              onClick={fetchPayments}
              disabled={isRefetching}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 border-blue-200 bg-white hover:bg-blue-50 text-sm font-semibold transition-colors flex-shrink-0 self-start sm:self-auto"
            >
              <ArrowPathIcon
                className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600 ${
                  isRefetching ? "animate-spin" : ""
                }`}
              />
              <span className="text-blue-600">
                {isRefetching ? "Refreshing…" : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="pb-24">
          {/* ---------- ERROR ---------- */}
          {error && <ErrorBoundary error={error} onRetry={fetchPayments} />}

          {/* ---------- NO LEASE ---------- */}
          {!error && lease === null && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <ExclamationCircleIcon className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-lg mb-1">
                    No Active Lease
                  </h3>
                  <p className="text-amber-800 text-sm">
                    No active lease agreement was found for this ID.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ---------- LEASE EXISTS, NO PAYMENTS ---------- */}
          {!error && lease !== null && payments.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCardIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Payment Records
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No payment records found for this lease yet.
              </p>
            </div>
          )}

          {/* ---------- LEASE + PAYMENTS ---------- */}
          {!error && lease !== null && payments.length > 0 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total Payments"
                  value={payments.length}
                  icon={<ChartBarIcon className="w-5 h-5 text-blue-600" />}
                />
                <StatCard
                  label="Confirmed"
                  value={
                    payments.filter((p) => p.payment_status === "confirmed")
                      .length
                  }
                  icon={
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                  }
                />
                <StatCard
                  label="Total Paid"
                  value={formatCurrency(
                    payments
                      .filter((p) => p.payment_status === "confirmed")
                      .reduce((s, p) => s + Number(p.amount_paid), 0)
                  )}
                  icon={<BanknotesIcon className="w-5 h-5 text-amber-600" />}
                />
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold">
                        Payment Reference
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold">
                        Date Paid
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold">
                        Type
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold">
                        Amount Paid
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((p) => (
                      <tr key={p.payment_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">
                          {p.gateway_transaction_ref}
                        </td>
                        <td className="px-6 py-4">
                          {p.payment_date}
                        </td>
                        <td className="px-6 py-4 uppercase text-sm">
                          {p.payment_type.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {formatCurrency(p.amount_paid)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${getStatusBadge(
                              p.payment_status
                            )}`}
                          >
                            {getStatusIcon(p.payment_status)}
                            {p.payment_status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= SMALL UI ================= */

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
        <p className="text-xs font-bold text-gray-600 uppercase">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
