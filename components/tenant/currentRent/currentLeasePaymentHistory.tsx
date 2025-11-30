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
import LoadingScreen from "@/components/loadingScreen";
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

  const fetchPayments = async () => {
    try {
      setIsRefetching(true);
      const res = await axios.get(
        `/api/tenant/payment/currentPaymentHistory?agreement_id=${agreement_id}`
      );

      if (res.status === 200) {
        setLease(res.data.leaseAgreement || null);
        setPayments(res.data.payments || []);
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
    fetchPayments().then(() => setLoading(false));
  }, [agreement_id]);

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
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
        <LoadingScreen message="Fetching your payment history..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <ReceiptPercentIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payment History
              </h1>
              <p className="text-gray-600 text-sm">
                Complete record of your lease payments
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchPayments()}
            disabled={isRefetching}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span>{isRefetching ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {/* Error State */}
        {error && (
          <div className="mb-6">
            <ErrorBoundary error={error} onRetry={() => fetchPayments()} />
          </div>
        )}

        {/* No Lease */}
        {!error && !lease && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0">
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

        {/* No Payments */}
        {!error && lease && payments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <CreditCardIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Payment Records
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No payment records found for this lease agreement yet. Your
              payment history will appear here once you make your payment.
            </p>
          </div>
        )}

        {/* Lease & Payments Content */}
        {!error && lease && payments.length > 0 && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Payments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Total Payments
                  </p>
                </div>
                <p className="text-4xl font-bold text-gray-900">
                  {payments.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">All time</p>
              </div>

              {/* Confirmed Payments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    Confirmed
                  </p>
                </div>
                <p className="text-4xl font-bold text-emerald-700">
                  {
                    payments.filter(
                      (p) => p.payment_status.toLowerCase() === "confirmed"
                    ).length
                  }
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Successfully processed
                </p>
              </div>

              {/* Total Amount */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <BanknotesIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Total Paid
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatCurrency(
                    payments
                      .filter(
                        (p) => p.payment_status.toLowerCase() === "confirmed"
                      )
                      .reduce((sum, p) => sum + Number(p.amount_paid), 0)
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-1">Confirmed only</p>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Payment ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Bill ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Payment Type
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                        <div className="flex items-center justify-end gap-2">
                          <BanknotesIcon className="w-4 h-4" />
                          Amount
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment, index) => (
                      <tr
                        key={payment.payment_id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                          #{payment.payment_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                          {payment.bill_id ? `#${payment.bill_id}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {formatDate(payment.payment_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-700 uppercase">
                            {payment.payment_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount_paid)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${getStatusBadge(
                                payment.payment_status
                              )}`}
                            >
                              {getStatusIcon(payment.payment_status)}
                              {payment.payment_status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.payment_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-bold text-gray-900">
                          {formatDate(payment.payment_date)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusBadge(
                          payment.payment_status
                        )}`}
                      >
                        {getStatusIcon(payment.payment_status)}
                        {payment.payment_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          Payment Type
                        </p>
                        <p className="text-sm font-bold text-gray-900 uppercase">
                          {payment.payment_type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          Amount Paid
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(payment.amount_paid)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Payment History Information
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    This shows all payments made for your current lease
                    agreement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
