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
} from "@heroicons/react/24/outline";
import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

interface Payment {
  payment_id: number;
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
      setError(
        `Failed to fetch payments. ${err.response?.data?.error || err.message}`
      );
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
        return "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200";
      case "pending":
        return "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200";
      default:
        return "bg-gradient-to-r from-rose-100 to-red-100 text-red-700 border border-red-200";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        <LoadingScreen message="Fetching your payment history..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCardIcon className="w-6 h-6 text-emerald-600" />
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Payment History
                </h1>
              </div>
              <button
                onClick={() => fetchPayments()}
                disabled={isRefetching}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-all font-medium text-sm whitespace-nowrap disabled:opacity-50"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
            <p className="text-gray-600 text-sm sm:text-base ml-8">
              View all payments for your rental lease
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6">
              <ErrorBoundary error={error} onRetry={() => fetchPayments()} />
            </div>
          )}

          {/* No Lease */}
          {!error && !lease && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <ExclamationCircleIcon className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900">No Active Lease</h3>
                  <p className="text-amber-800 text-sm mt-1">
                    No active lease found for this agreement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Payments */}
          {!error && lease && payments.length === 0 && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <CreditCardIcon className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">
                    No Payment Records
                  </h3>
                  <p className="text-blue-800 text-sm mt-1">
                    No payment records found for this lease agreement yet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lease & Payments Content */}
          {!error && lease && payments.length > 0 && (
            <div className="space-y-6 sm:space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-white border border-gray-100 text-center">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Payments
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                    {payments.length}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Confirmed
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-700 mt-2">
                    {
                      payments.filter(
                        (p) => p.payment_status.toLowerCase() === "confirmed"
                      ).length
                    }
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-white border border-gray-100 text-center">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Amount
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-2">
                    {formatCurrency(
                      payments
                        .filter(
                          (p) => p.payment_status.toLowerCase() === "confirmed"
                        )
                        .reduce((sum, p) => sum + Number(p.amount_paid), 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Type
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr
                        key={payment.payment_id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            {formatDate(payment.payment_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase">
                          {payment.payment_type.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(payment.amount_paid)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.payment_status)}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                                payment.payment_status
                              )}`}
                            >
                              {payment.payment_status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.payment_id}
                    className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Payment Date
                        </p>
                        <p className="text-base font-bold text-gray-900 mt-1 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${getStatusBadge(
                          payment.payment_status
                        )}`}
                      >
                        {getStatusIcon(payment.payment_status)}
                        {payment.payment_status.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Type
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-1 uppercase">
                          {payment.payment_type.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Amount
                        </p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatCurrency(payment.amount_paid)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
